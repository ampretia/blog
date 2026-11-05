---
title: "Apache Arrow Flight and Substrait: moving data and meaning at scale"
date: '2026-11-05'
layout: post
slug: apache-flight-substrait
summary: "Modern data systems need to move data quickly and describe what to do with it in a way every engine understands. Arrow Flight and Substrait solve these problems independently, and compose into a decoupled query architecture."
tags:
    - apache-arrow
    - substrait
    - data-engineering
keywords:
    - apache arrow flight
    - substrait
    - query plan
    - grpc
    - protobuf
    - flight sql
---

Is the table called `vehicles.Cars`, `cars`, `auto-schema.vehicles.CARS`, or `s3://data/vehicles/cars`? In a large estate the answer is often "all of them", depending on which engine you ask. Getting a query to run on any of them, and getting the results back without a costly format conversion, takes two separate pieces of work. [Apache Arrow Flight](https://arrow.apache.org/docs/format/Flight.html) handles the movement of data, and [Substrait](https://substrait.io) handles the description of what to do with it. Each is useful alone. Together they let the client stop caring which execution engine sits behind the connection, though the naming question above does not go away by itself, and the last section returns to it.

## Apache Arrow Flight

### What it is

Apache Arrow Flight is a high-performance RPC[^rpc] framework for moving columnar data over the network. It is built on [gRPC](https://grpc.io) and the Apache Arrow columnar memory format, and it is designed to avoid the serialisation overhead of traditional data transfer protocols.

Before Flight, transferring a result set between two systems meant serialising rows into a wire format (JSON, Thrift, JDBC row packets), transmitting them, and deserialising them on the other side. Each step costs CPU and adds latency. Flight removes most of that cost by keeping data in the Arrow columnar format end to end. The layout used for computation in memory is, for the most part, the layout sent on the wire. The Arrow project's own [announcement of Flight SQL](https://arrow.apache.org/blog/2022/02/16/introducing-arrow-flight-sql/) reports Flight as up to 20x faster than PyODBC.

There are many ways of serialising and transferring data, and many standards have been proposed over the years. What I like about Flight is that it takes established technology (gRPC, [Protocol Buffers](https://protobuf.dev), the Arrow [IPC format](https://arrow.apache.org/docs/format/Columnar.html#serialization-and-interprocess-communication-ipc)) and adds the missing part: a standard way to say "here is a dataset, fetch it in parallel from these places".

### How it works

I'll summarise Flight here. For a more detailed breakdown with good examples, I recommend Danielle Navarro's [Building an Arrow Flight server](https://blog.djnavarro.net/posts/2022-10-18_arrow-flight/). A Flight service exposes a small set of RPC operations:

- **`GetFlightInfo`**: the client describes what data it wants; the server responds with a `FlightInfo` containing one or more _endpoints_, each pairing a ticket with a location.
- **`DoGet`**: the client presents a ticket to a (possibly different) server and receives a stream of Arrow record batches.
- **`DoPut`**: the client streams Arrow record batches to a server for ingestion.
- **`DoAction` / `ListActions`**: a general-purpose extension point for operations that do not fit the data-streaming model, such as cancelling a running query.

The separation between `GetFlightInfo` and `DoGet` is deliberate. A single coordinating node can return a list of endpoints pointing to multiple data nodes, allowing a client to fan out and read partitions in parallel. The coordinator is not on the data path, so it does not become the bottleneck.

Because Arrow is zero-copy-friendly, a Flight server can respond to a `DoGet` request by memory-mapping a file and streaming it with minimal copying into a separate buffer.

Flight's control messages are Protocol Buffers; the record batches themselves travel in Arrow IPC format inside the gRPC stream. This matters here because Substrait also defines its plans in protobuf, so a Substrait plan can be carried in a Flight message without an additional encoding layer.

## Apache Arrow Flight SQL

[Flight SQL](https://arrow.apache.org/docs/format/FlightSql.html) is a protocol built _on top of_ Flight. It standardises how SQL-oriented clients talk to data engines, and adds to base Flight:

- A defined set of RPC commands for executing statements, using prepared statements, and querying metadata such as catalogs, schemas, and tables.
- A Substrait command, `CommandStatementSubstraitPlan`, which lets a client submit a Substrait plan directly. No SQL string is needed, but the same wire protocol is used.
- Server capability reporting, through `CommandGetSqlInfo`. A server states whether it supports Substrait, and the minimum and maximum Substrait versions it accepts (`FLIGHT_SQL_SERVER_SUBSTRAIT`, `FLIGHT_SQL_SERVER_SUBSTRAIT_MIN_VERSION`, `FLIGHT_SQL_SERVER_SUBSTRAIT_MAX_VERSION`).
- Session options (`SetSessionOptions`, `GetSessionOptions`). The specification gives the current catalog and schema as typical examples. This turns out to be relevant later.
- Compatibility with [ADBC](https://arrow.apache.org/docs/format/ADBC.html) (Arrow Database Connectivity), which accepts queries as SQL strings or Substrait plans, and with JDBC and ODBC drivers built on Flight SQL.

The layering is simple:

```
Apache Arrow Flight          ← streaming transport (gRPC + Arrow IPC)
└── Apache Arrow Flight SQL  ← standard SQL and Substrait command layer
```

It is a slight shame that SQL appears in the name. SQL support and Substrait support are reported as separate capabilities, so you can implement a Flight SQL server without going anywhere near SQL.

## Substrait

### What it is

Substrait is an open specification for representing relational algebra: the logical and physical plans that query engines produce and consume. It defines a language-neutral, binary-serialisable format (using Protocol Buffers) that captures projections, filters, joins, aggregations, sorts, and the full relational operator tree.

Where SQL is a text format designed for humans to write, Substrait is a structured format designed for systems to exchange. It is not a replacement for SQL; it sits _between_ a query parser and a query engine.

A plan can be built from SQL, from a programmatic API, or from its JSON form. Because it is neutral, it can be turned back into dialect-specific SQL, or mapped directly onto an engine's own internal logical tree, skipping the text round trip altogether. The [SQL to Substrait tutorial](https://substrait.io/tutorial/sql_to_substrait/) walks through building a plan for a join-and-aggregate query and is the best place to start reading real plans.

The Substrait project's stated benefit is that each system only needs to produce and consume Substrait, rather than every pair of systems needing its own integration. The comparison I've heard is object storage. A neutral S3-style API is part of what made the [lakehouse](https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf) architecture practical, because storage stopped being tied to a particular product. A neutral representation at the query plan layer could do the same for compute.

The central use case is decoupling plan production from plan execution. A query frontend (a SQL parser, a dataframe library, or a BI tool) compiles a user request into a Substrait plan and hands it to any compliant execution engine, without knowing whether that engine is written in Java, C++, Rust, or Python. A plan produced from an SQL query can run against one engine, or be converted into an [IBM DataStage](https://www.ibm.com/products/datastage) flow. Both see the same logical intent.

For a product that has to support several back ends, this is a stable contract between query construction and query execution. Instead of generating a different SQL dialect for each target database, the product emits one plan and lets the execution layer resolve it against whichever engine is available, for example [DuckDB](https://substrait.io/community/powered_by/) for embedded work. It resembles what JDBC gives you, but at the logical plan level rather than the API level. Filters, projections, and joins are encoded once, the engine can be swapped without touching product code, and the engine decides how to push predicates down.

The ecosystem is already there to build on. The project's [Powered by Substrait](https://substrait.io/community/powered_by/) page lists, among others, Acero (the Arrow C++ engine), DataFusion (producer and consumer), DuckDB, Ibis (producer), and Velox (consumer). How much of the specification each one covers varies, and that needs checking against the plans you intend to send.

### How it works

This too is a brief summary. Substrait has far more scope and features than I cover here.

A Substrait plan is a tree of `Rel` (relation) nodes, each describing a relational operation:

- **`ReadRel`**: read from a named table or file with an optional filter pushed down.
- **`FilterRel`**: apply a predicate to a stream of rows.
- **`ProjectRel`**: compute new columns via scalar expressions.
- **`AggregateRel`**: group and aggregate.
- **`JoinRel`**: combine two relations on a condition.

A read of a named table looks like this in Substrait's JSON form (taken from the tutorial, trimmed to one column):

```json
{
  "read": {
    "namedTable": { "names": ["orders"] },
    "baseSchema": {
      "names": ["product_id"],
      "struct": {
        "types": [{ "i64": { "nullability": "NULLABILITY_REQUIRED" } }],
        "nullability": "NULLABILITY_REQUIRED"
      }
    }
  }
}
```

Note that the table is identified only by `names`. That detail matters in the next section.

Expressions within these nodes use a typed tree of `Expression` messages (field references, literals, scalar function invocations, and casts). Functions are referenced against published [extension files](https://substrait.io/extensions/), so that `add(x, y)` means the same thing regardless of which engine is reading the plan, and the plan states which extension files it relies on. Types are equally explicit, with their own [type system](https://substrait.io/types/type_system/) including nullability as part of every type.

## Putting it together

Connecting systems this way produces an impedance mismatch at several points. Here are the ones I have met, and how I deal with them.

1. **Definitions of relations and expressions.** Even SQL, a standard, has implementations with deliberate extensions or subtle differences in behaviour. Mapping operations and expressions is always going to be a challenge.
2. **Data types.** What is the specification of an `int`, how is it expressed, what are its ranges, and which operations accept it? It feels a long time since I was actively worrying about endianness, and there have been improvements even with timezones and dates.

The approach for both: a) decide what the wire format is, in this case Flight and Substrait's model; b) have clients write requests in that format; and c) make the consumers do the work, converting to their own engine's preferences at the last possible moment. Where an operation has no equivalent, use the extension mechanisms in Substrait and Flight rather than bending the core model.

Once those are handled, a third problem remains: where the data actually is, and how it is referred to. There are good standards for naming (URI, URN, and so on), but as the `ReadRel` above shows, a bare Substrait plan carries only a list of name segments. Different engines want different things from them: a default catalog and database for Presto, a bucket path for an object store engine, a namespace for a lakehouse.

I have tried several approaches. The first wrapped the plan in another structure that embedded per-engine data mappings in the payload. I discarded it. It added complexity, left it unclear who owned the mapping data, and required plan modification that amounted to over-engineering. Engine-specific concerns inside the plan work against the portability Substrait exists to provide.

The alternative is to leave the plan as a pure description of the query and supply engine hints alongside it at execution time: the default catalog, database, or other engine-specific properties. The plan describes _what_; the hints describe _where_ for a given engine. Flight SQL already has a standard place for some of this, since its session options are defined to carry settings such as the current catalog and schema.

That leaves the question of where the hints come from. There are four realistic options:

| Option | Cost |
|---|---|
| Neutral names on the wire, rewritten just before execution | A rewriting step that must know every engine's rules |
| A lakehouse giving one name across all engines | Only works where all the data is in the lakehouse |
| Clients know every data layout | Defeats the purpose of a neutral plan |
| Each engine resolves names alone | Every engine reimplements the same mapping, differently |

A central catalog holding the mapping, which each engine consults, seems to me the best of these. Catalogs such as the [Iceberg REST catalog](https://iceberg.apache.org/rest-catalog-spec/), [Hive Metastore](https://hive.apache.org/) and [Unity Catalog](https://www.unitycatalog.io/) show the shape of this.

Put together, the flow looks like this:

![Client sends a Substrait plan and session options to Flight SQL, which passes them to execution engines; the engines return Arrow record batches to the client with DoGet, while a central catalog supplies hints to the client and resolves names for the engines](/apache-flight-substrait/architecture.svg)

## Summary

Flight and Substrait address complementary layers of the data stack:

| Layer | Problem | Solution |
|---|---|---|
| Semantics | Describing relational operations portably | Substrait |
| Transport | Moving columnar data fast | Apache Arrow Flight |

Used together, they form the foundation of a decoupled query architecture. The client receives a data stream. Whether that stream was produced by a Spark cluster, a SQL database, or a native Arrow engine is opaque to it.

Both DataFusion and Velox have Substrait support, and Flight SQL standardises the client-facing side, accepting either SQL strings or Substrait plans. Where data transfer and query semantics are both standardised, engines can be swapped, optimisers can be composed, and adding a new execution back end costs less.

## Further reading

- [Introducing Apache Arrow Flight](https://arrow.apache.org/blog/2019/10/13/introducing-arrow-flight/)
- [Introducing Apache Arrow Flight SQL](https://arrow.apache.org/blog/2022/02/16/introducing-arrow-flight-sql/)
- [Arrow Flight RPC specification](https://arrow.apache.org/docs/format/Flight.html)
- [Flight SQL specification](https://arrow.apache.org/docs/format/FlightSql.html)
- [Building an Arrow Flight server](https://blog.djnavarro.net/posts/2022-10-18_arrow-flight/)
- [Substrait specification](https://substrait.io)
- [SQL to Substrait tutorial](https://substrait.io/tutorial/sql_to_substrait/)
- [Powered by Substrait](https://substrait.io/community/powered_by/)

[^rpc]: Remote Procedure Call: a way for a program to invoke a function on another machine as though it were a local call, with the network transport and data encoding handled by the framework.
