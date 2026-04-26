import { GraphQLScalarType } from 'graphql';
import { DateTimeResolver } from 'graphql-scalars';

/**
 * Renombramos DateTimeResolver -> "Date" para que coincida exactamente con
 * `scalar Date` declarado en typeDefs.
 *
 * Si solo hicieramos `{ Date: DateTimeResolver }`, la salida funcionaria
 * (resuelve por la key del map) pero la validacion de variables de entrada
 * fallaria con "Unknown type Date" porque graphql-js busca el tipo por
 * `name` interno (que en DateTimeResolver es "DateTime").
 */
const DateScalar = new GraphQLScalarType({
  ...DateTimeResolver,
  name: 'Date',
});

export const scalarsResolvers = {
  Date: DateScalar,
};
