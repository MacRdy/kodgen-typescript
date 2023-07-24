# Kodgen TypeScript generators

[![npm](https://img.shields.io/npm/v/kodgen-typescript)](https://www.npmjs.com/package/kodgen-typescript)

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

[ng-typescript generation example](https://github.com/MacRdy/kodgen-example/tree/main/kodgen-typescript/ng-typescript)

### 2. `axios-typescript` - Axios based generator

```
kodgen generate -p kodgen-typescript -g axios-typescript -o ./api -i YOUR_SPEC_PATH
```

[axios-typescript generation example](https://github.com/MacRdy/kodgen-example/tree/main/kodgen-typescript/axios-typescript)

### 3. `fetch-typescript` - Native fetch generator

```
kodgen generate -p kodgen-typescript -g fetch-typescript -o ./api -i YOUR_SPEC_PATH
```

[fetch-typescript generation example](https://github.com/MacRdy/kodgen-example/tree/main/kodgen-typescript/fetch-typescript)

### Configuration object (all generators)

| Property                | Default | Description                                                                                                                   |
|-------------------------|---------|-------------------------------------------------------------------------------------------------------------------------------|
| `index`                 | `true`  | Create an index file with all exported entities                                                                               |
| `inlinePathParameters`  | `true`  | Inline path parameters mode. PathParameters property types appear in imports, but not the PathParameters models themselves    |
| `readonly`              | `true`  | Readonly model properties                                                                                                     |
| `useNativeEnums`        | `false` | Generate native enum entities instead of type-const variant                                                                   |

[JSON Schema (ng-typescript config)](assets/ng-typescript-config-schema.json)

[JSON Schema (axios-typescript config)](assets/axios-typescript-config-schema.json)

[JSON Schema (fetch-typescript config)](assets/fetch-typescript-config-schema.json)

### Available hooks (all generators)

| Hook name               | Type                         | Description                                                                      |
|-------------------------|------------------------------|----------------------------------------------------------------------------------|
| `generateEnumName`      | `TsGenGenerateEnumName`      | Generate enum name (defaults to pascal case)                                     |
| `generateModelName`     | `TsGenGenerateModelName`     | Generate model name (defaults to pascal case)                                    |
| `generatePropertyName`  | `TsGenGeneratePropertyName`  | Generate property name (complex query param models only, defaults to camel case) |
| `generateServiceName`   | `TsGenGenerateServiceName`   | Generate service name (defaults to pascal case)                                  |
| `generateOperationName` | `TsGenGenerateOperationName` | Generate operation name (defaults to camel case)                                 |
| `resolveSimpleType`     | `TsGenResolveSimpleType`     | Simple type resolver (schema type to TypeScript type converter)                  |
