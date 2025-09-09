# Polkablocks

## Starting the squid

All Substrate squid templates are complete simple squids. They can run locally immediately upon being downloaded, provided that `sqd` and Docker are available.

The "processor" process is present in all squids. It downloads pre-filtered blockchain data from [Subsquid Archives](https://docs.subsquid.io/archives/), applies any necessary transformations and saves the result in an [application-appropriate storage](https://docs.subsquid.io/basics/store/). All template squids store their data to a Postgresql database and provide a way to access it via a GraphQL API.

To start the processor, run
```bash
cd <new-project-name>
npm ci
sqd build
sqd up # starts a Postgres database in a Docker container
sqd process
```
Processor should now be running in foreground, printing messages like
```
01:02:37 INFO  sqd:processor 234354 / 16519081, rate: 17547 blocks/sec, mapping: 2420 blocks/sec, 2945 items/sec, ingest: 794 blocks/sec, eta: 16m
```
The extracted data will begin accumulating in the database available at `localhost:23798` (consult the template's `.env` file for login and password). If you want to access it via GraphQL, run
```bash
sqd serve
```
in a separate terminal in the `<new-project-name>` folder. Graphical query builder will be available at [http://localhost:4350/graphql](http://localhost:4350/graphql).
