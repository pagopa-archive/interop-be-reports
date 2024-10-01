# Interoperability Reports

## How to start

To get started, you will need:

- Node.js (https://nodejs.org/en/download/package-manager)
- pnpm (https://pnpm.io/installation)

Then install the dependencies and build the project:

```
pnpm install && pnpm build
```

## How to run a single job in watch mode

```
pnpm start:<job-name>
# example: pnpm start:dtd-catalog-exporter
```

## How to build a single job

```
pnpm build:<job-name>
# example: pnpm build:dtd-catalog-exporter
```

## How to run the tests

```
pnpm test
```

## How to create a new job

There is a script that will scaffold a new job for you:

```
pnpm create-new-job
```

# Deprecated services
- dtd-catalog-total-load-exporter
- dtd-metrics
- metrics-report-generator