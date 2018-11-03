import * as _ from 'lodash';
import { getClassFromObject } from 'ng2-rest/helpers';
import { getClassName } from 'ng2-rest';
import { ModelDataConfig } from './model-data-config';
export const MetaDB: { [modelName in string]: MetaDBEntity[] } = {} as any;

export interface MetaDBModel {
    id?: number;
}

export class MetaDBEntity {
    public realtime: boolean;
    public configs: ModelDataConfig[];
    public model: MetaDBModel;
}

export class RferenceMetaEntity {
    constructor(
        public ids: number | number[],
        public entity: Function

    ) {

    }

    get model<T = MetaDBModel>(): MetaDBModel | MetaDBModel[] {
        const name = getClassName(this.entity);
        if (_.isArray(this.ids)) {
            return this.ids.map(id => {
                const metadbEntity = MetaDB[name].find(a => a.model.id === id)
                return this.decodeModel(metadbEntity.model, metadbEntity.configs);
            })
        }
        const metadbEntity = MetaDB[name].find(a => a.model.id === this.ids)
        return this.decodeModel(metadbEntity.model, metadbEntity.configs);
    }


    decodeModel(model: MetaDBModel, configs: ModelDataConfig[]) {
        return undefined;
    }

}



function metaField(model: MetaDBModel) {
    const entityClass = getClassFromObject(model);
    const name = getClassName(entityClass);
    return MetaDB[name].find(d => d.model.id === model.id);
}

function mereModel(model: MetaDBModel) {
    const currentMetaField = metaField(model);

}

function metaEncode(model: MetaDBModel | any, metaObj = {}) {

    for (const key in model) {
        if (model.hasOwnProperty(key)) {
            const element = model[key];
            if (_.isArray(element)) {
                element.forEach(e => metaEncode(element, metaObj));
            } else if (_.isObject(element)) {
                metaEncode(element, metaObj)
            } else {
                _.set(metaObj, key, element);
            }
        }
    }

}

function onGenEntity(model) {
    const entityClass = getClassFromObject(model);
    const name = getClassName(entityClass);

    _
    MetaDB[name] = 
}