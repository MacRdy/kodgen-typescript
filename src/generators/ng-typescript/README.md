# `ng-typescript`

Angular-TypeScript generator

## Generator configuration

| Property                | Default | Description                                                 |
|-------------------------|---------|-------------------------------------------------------------|
| `index`                 | `true`  | Create an index file with all exported entities             |
| `inlinePathParameters`  | `true`  | Inline or single path parameters mode                       |
| `readonly`              | `true`  | Use readonly properties                                     |
| `useNativeEnums`        | `false` | Use native enum entities instead of type-const variant      |

[JSON Schema](assets/ng-typescript-config-schema.json)

## Available hooks

| Hook name               | Type                         | Description                                                                      |
|-------------------------|------------------------------|----------------------------------------------------------------------------------|
| `generateEnumName`      | `TsGenGenerateEnumName`      | Generate enum name (defaults to pascal case)                                     |
| `generateModelName`     | `TsGenGenerateModelName`     | Generate model name (defaults to pascal case)                                    |
| `generatePropertyName`  | `TsGenGeneratePropertyName`  | Generate property name (complex query param models only, defaults to camel case) |
| `generateServiceName`   | `TsGenGenerateServiceName`   | Generate service name (defaults to pascal case)                                  |
| `generateOperationName` | `TsGenGenerateOperationName` | Generate operation name (defaults to camel case)                                 |
| `resolveSimpleType`     | `TsGenResolveSimpleType`     | Simple type resolver (schema type to TypeScript type converter)                  |
