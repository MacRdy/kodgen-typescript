# Kodgen TypeScript generators

[![npm](https://img.shields.io/npm/v/kodgen-typescript)](https://www.npmjs.com/package/kodgen-typescript)
[![license](https://img.shields.io/github/license/MacRdy/kodgen-typescript)](blob/main/LICENSE)

Collection of TypeScript generators for [kodgen](https://github.com/MacRdy/kodgen). JSDoc included.

## Installation

```
npm install kodgen-typescript --save-dev
```

## Generators

### 1. `ng-typescript` - Angular-TypeScript generator

```
kodgen generate -p kodgen-typescript -g ng-typescript -o ./api -i YOUR_SPEC_PATH
```

[Options](/generators/ng-typescript) | [Examples](https://github.com/MacRdy/kodgen-example/tree/main/kodgen-typescript/ng-typescript)

### 2. `axios-typescript` - Axios-based generator

```
kodgen generate -p kodgen-typescript -g axios-typescript -o ./api -i YOUR_SPEC_PATH
```

[Options](/generators/axios-typescript) | [Examples](https://github.com/MacRdy/kodgen-example/tree/main/kodgen-typescript/axios-typescript)

### 3. `fetch-typescript` - Native Fetch API generator

```
kodgen generate -p kodgen-typescript -g fetch-typescript -o ./api -i YOUR_SPEC_PATH
```

[Options](/generators/fetch-typescript) | [Examples](https://github.com/MacRdy/kodgen-example/tree/main/kodgen-typescript/fetch-typescript)
