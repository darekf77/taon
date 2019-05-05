export * from '@angular/core';
import {
  Input as AngularInput,
  Component as AngularComponent,
} from '@angular/core';
import { Component as ComponentOptions } from '@angular/core/src/metadata/directives.d';
import { CLASS } from 'typescript-class-helpers';
import { SYMBOL } from '../symbols';

export type MorphiComponentOptions = ComponentOptions & { className?: string };



export function Component(options: MorphiComponentOptions) {
  return function (target) {
    if (!options) {
      options = {}
    }
    CLASS.NAME(options.className)(target);
    AngularComponent(options)(target)
  } as any;
}

export function Input(bindingPropertyName?: string) {
  return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
    if (target.constructor[SYMBOL.ANGULAR.INPUT_NAMES] === void 0) {
      target.constructor[SYMBOL.ANGULAR.INPUT_NAMES] = []
    }
    (target.constructor[SYMBOL.ANGULAR.INPUT_NAMES] as any[]).push(propertyKey)
    AngularInput(bindingPropertyName)(target)
  } as any;
}

export function getComponentInputNames(target: Function): string[] {
  let names: string[] = Array.isArray(target[SYMBOL.ANGULAR.INPUT_NAMES]) ? target[SYMBOL.ANGULAR.INPUT_NAMES] : [];
  const parent: Function = Object.getPrototypeOf(target);
  if (parent && parent.name !== '') {
    names = names.concat(getComponentInputNames(parent))
  }
  return names;
}
