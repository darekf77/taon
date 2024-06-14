import { _ } from 'tnp-core/src';
import { Models } from './models';

export namespace Validators {
  //#region vlidate class name
  export const classNameVlidation = (className, target: Function) => {
    setTimeout(() => {
      // console.log(`check after timeout ${className} , production mode: ${FrameworkContext.isProductionMode}`)
      if (_.isUndefined(className)) {
        throw `[Firedev]
      Please provide "className" property for each Controller and Entity:

          @Firedev.Controller({ className: 'MyExampleCtrl'  })
          class MyExampleCtrl {
            ...
          }

          @Firedev.Entity({ className: 'MyExampleEntity'  })
          class MyExampleEntity {
            ...
          }

    Notice that minified javascript code does not preserve
    Functions/Classes names -this is only solution to preserve classes names.

        `;
      }
    });

    return _.isUndefined(className) ? target.name : className;
  };
  //#endregion

  //#region validate method config
  export const checkIfMethodsWithReponseTYpeAlowed = (
    methods: Models.MethodConfig[],
    current: Models.MethodConfig,
  ) => {
    const defaultResponseType = 'text or JSON';
    if (!current.responseType) {
      return;
    }
    for (let index = 0; index < methods.length; index++) {
      const m = methods[index];
      if (m.path === current.path && m.responseType !== current.responseType) {
        throw new Error(`
  [firedev] you can have 2 methods with same path but differetn reponseType-s

          ${m.methodName}( ... path: ${m.path} )  -> responseType: ${m.responseType || defaultResponseType}
          ${current.methodName}( ... path: ${current.path} ) -> responseType: ${current.responseType}

    Please change path name on of the methods.

        `);
      }
    }
  };
  //#endregion

  //#region validate class functions
  // TODO
  export const validateClassFunctions = (
    controllers: any[],
    entities: any[],
    proviers: any[],
    repositories: any[],
  ) => {
    if (
      _.isArray(controllers) &&
      controllers.filter(f => !_.isFunction(f)).length > 0
    ) {
      console.error('controllers', controllers);
      throw `

  Incorect value for property "controllers" inside Firedev.Init(...)

  `;
    }

    if (
      _.isArray(entities) &&
      entities.filter(f => !_.isFunction(f)).length > 0
    ) {
      console.error('entites', entities);
      throw `

  Incorect value for property "entities" inside Firedev.Init(...)

  `;
    }
  };
  //#endregion

  export const preventUndefinedModel = (model, id) => {
    if (_.isUndefined(model)) {
      throw `Bad update by id, config, id: ${id}`;
    }
  };
}
