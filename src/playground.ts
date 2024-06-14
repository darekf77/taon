// class Pilot {

//   id: string;
//   name: string;
//   airplane: Airplane;
// }

// class Airplane {
//   serial_number: string;
//   pilot: Pilot;
//   secondPilot: Pilot;
// }

// const pilot: Pilot = void 0;
// pilot.airplane
//   /* */
//   .secondPilot
//   .name

// import { QueryBuilder, SelectQueryBuilder } from 'firedev-typeorm'

// type BaseQueryBuilder<T> = Pick<QueryBuilder<T>, 'select'>
// type BaseSelectQueryBuilder<T> = Pick<SelectQueryBuilder<T>, 'getMany' | 'delete' | 'getManyAndCount'>

// export class BrowserQueryBuilder<T> implements BaseQueryBuilder<T> {

//   // @ts-ignore
//   select(): BaseSelectQueryBuilder<T>
//   // @ts-ignore
//   select(selection: string, selectionAliasName?: string): BaseSelectQueryBuilder<T>
//   // @ts-ignore
//   select(selection: string[]): BaseSelectQueryBuilder<T>
//   // @ts-ignore
//   select(selection?: any, selectionAliasName?: any): BaseSelectQueryBuilder<T> {
//     return
//   }

// }

// const c: BrowserQueryBuilder<Pilot>;
// c.select('').delete('')

// import { of, delay, map, delayWhen, Observable, from } from 'rxjs';

// class Pilot {

//   id: string;
//   name: string;
// }

// class Airplane {
//   serial_number: string;
//   pilot: Pilot;
//   secondPilot: Pilot;
// }

// type Operator = '<=' | '>=' | '=';

// class QueryBuilder<T> {

//   static from<T>() {
//     return new QueryBuilder<T>();
//   }

//   select(props: keyof T) {
//     return new QueryBuilderSelect<T>()
//   }

// }

// export type OnlyGql = {
//   graphql: string;
// }

// export type Rest = {
//   queryParams: string;
// }

// function RestQuery<T = any, KEY = keyof T>(queryParams?: any) {
//   const self = this;
//   const res = {
//     select(property: KEY) {
//       return self as typeof res;
//     }, // @ts-ignore
//     where(property: `${KEY} ${Operator} ${KEY}`) {
//       return self as typeof res;
//     },
//     join<ANOTHER_ENTITY>() {
//       return self as typeof res;
//     },
//     like() {
//       return self as typeof res;
//     }
//   };
//   return res;
// }

// RestQuery<Airplane>().select('pilot').where('secondPilot <= secondPilot')

// // const asd = gql`

// // `;

// class QueryBuilderSelect<T> {

//   graphql: string;

// }

// const AirplaneEntity = {};

// QueryBuilder.from<Airplane>()
//   .select('pilot').where('pilot')

// type Info = {

// }

// // function joinWith(entity) {
// //   return function <T>(fn: (entity: T) => Info) {

// //   }
// // }

// // export interface UnaryFunction<T, R> {
// //   (source: T): R;
// // }

// // export function identity<T>(x: T): T {
// //   return x;
// // }

// // function queryBuilder<D = any>() {
// //   return {
// //     pipe: pipe<D>()
// //   };
// // }

// // queryBuilder<Pilot>().pipe(
// //   map(a => a. )
// // )

// // export function pipe(): typeof identity;
// // export function pipe<T, A>(fn1: UnaryFunction<T, A>): UnaryFunction<T, A>;
// // export function pipe<T, A, B>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>): UnaryFunction<T, B>;
// // export function pipe<T, A, B, C>(fn1: UnaryFunction<T, A>, fn2: UnaryFunction<A, B>, fn3: UnaryFunction<B, C>): UnaryFunction<T, C>;
// // export function pipe<T, A, B, C, D>(
// //   fn1: UnaryFunction<T, A>,
// //   fn2: UnaryFunction<A, B>,
// //   fn3: UnaryFunction<B, C>,
// //   fn4: UnaryFunction<C, D>
// // ): UnaryFunction<T, D>;
// // export function pipe<T, A, B, C, D, E>(
// //   fn1: UnaryFunction<T, A>,
// //   fn2: UnaryFunction<A, B>,
// //   fn3: UnaryFunction<B, C>,
// //   fn4: UnaryFunction<C, D>,
// //   fn5: UnaryFunction<D, E>
// // ): UnaryFunction<T, E>;
// // export function pipe<T, A, B, C, D, E, F>(
// //   fn1: UnaryFunction<T, A>,
// //   fn2: UnaryFunction<A, B>,
// //   fn3: UnaryFunction<B, C>,
// //   fn4: UnaryFunction<C, D>,
// //   fn5: UnaryFunction<D, E>,
// //   fn6: UnaryFunction<E, F>
// // ): UnaryFunction<T, F>;
// // export function pipe<T, A, B, C, D, E, F, G>(
// //   fn1: UnaryFunction<T, A>,
// //   fn2: UnaryFunction<A, B>,
// //   fn3: UnaryFunction<B, C>,
// //   fn4: UnaryFunction<C, D>,
// //   fn5: UnaryFunction<D, E>,
// //   fn6: UnaryFunction<E, F>,
// //   fn7: UnaryFunction<F, G>
// // ): UnaryFunction<T, G>;
// // export function pipe<T, A, B, C, D, E, F, G, H>(
// //   fn1: UnaryFunction<T, A>,
// //   fn2: UnaryFunction<A, B>,
// //   fn3: UnaryFunction<B, C>,
// //   fn4: UnaryFunction<C, D>,
// //   fn5: UnaryFunction<D, E>,
// //   fn6: UnaryFunction<E, F>,
// //   fn7: UnaryFunction<F, G>,
// //   fn8: UnaryFunction<G, H>
// // ): UnaryFunction<T, H>;
// // export function pipe<T, A, B, C, D, E, F, G, H, I>(
// //   fn1: UnaryFunction<T, A>,
// //   fn2: UnaryFunction<A, B>,
// //   fn3: UnaryFunction<B, C>,
// //   fn4: UnaryFunction<C, D>,
// //   fn5: UnaryFunction<D, E>,
// //   fn6: UnaryFunction<E, F>,
// //   fn7: UnaryFunction<F, G>,
// //   fn8: UnaryFunction<G, H>,
// //   fn9: UnaryFunction<H, I>
// // ): UnaryFunction<T, I>;
// // export function pipe<T, A, B, C, D, E, F, G, H, I>(
// //   fn1: UnaryFunction<T, A>,
// //   fn2: UnaryFunction<A, B>,
// //   fn3: UnaryFunction<B, C>,
// //   fn4: UnaryFunction<C, D>,
// //   fn5: UnaryFunction<D, E>,
// //   fn6: UnaryFunction<E, F>,
// //   fn7: UnaryFunction<F, G>,
// //   fn8: UnaryFunction<G, H>,
// //   fn9: UnaryFunction<H, I>,
// //   ...fns: UnaryFunction<any, any>[]
// // ): UnaryFunction<T, unknown>;
