//#region @websql
import { Entity } from "firedev-typeorm/src";
//#endregion
import { EndpointContext } from "../endpoint-context";
import { Symbols } from "../symbols";
import { BaseClass } from "./base-class";

//#region @websql
@Entity()
//#endregion
export abstract class BaseEntity extends BaseClass {

}
