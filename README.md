# TypeScript generators

Collection of TypeScript entities generators for [kodgen](https://github.com/MacRdy/kodgen). JSDoc included.

## Installation

```
npm install kodgen-typescript --save-dev
```

## `ng-typescript`

Angular-TypeScript generator

### Configuration object ([schema](assets/generators/ng-typescript-config-schema.json))

| Property                | Default | Description                                                                                                                   |
|-------------------------|---------|-------------------------------------------------------------------------------------------------------------------------------|
| `index`                 | `true`  | Create an index file with all exported entities                                                                               |
| `inlinePathParameters`  | `true`  | Inline path parameters mode. PathParameters property types appear in imports, but not the PathParameters models themselves    |
| `readonly`              | `true`  | Readonly model properties                                                                                                     |

### Available hooks

| Hook name               | Type                         | Description                                                                      |
|-------------------------|------------------------------|----------------------------------------------------------------------------------|
| `generateEnumName`      | `TsGenGenerateEnumName`      | Generate enum name (defaults to pascal case)                                     |
| `generateModelName`     | `TsGenGenerateModelName`     | Generate model name (defaults to pascal case)                                    |
| `generatePropertyName`  | `TsGenGeneratePropertyName`  | Generate property name (complex query param models only, defaults to camel case) |
| `generateServiceName`   | `TsGenGenerateServiceName`   | Generate service name (defaults to pascal case)                                  |
| `generateOperationName` | `TsGenGenerateOperationName` | Generate operation name (defaults to camel case)                                 |
| `resolveSimpleType`     | `TsGenResolveSimpleType`     | Simple type resolver (schema type to TypeScript type converter)                  |
