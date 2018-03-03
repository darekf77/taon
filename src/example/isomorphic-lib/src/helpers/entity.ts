

/**
 * Return table name for typeorm
 * @param entityClass TypeOrm entity class
 */
export function __(entityClass: Function) {
    return `tb_${entityClass.name.toLowerCase()}`
};
