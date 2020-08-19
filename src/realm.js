'use strict';
const _ = require('lodash');
const Realm = require('realm');
const schema = require('./schema');

const schemaClassArray = Object.keys(schema).map((k) => schema[k]);
let realm;
let newObjectRealm;

const app = new Realm.App({ id: "tp-realm-2-ovjcx" });

const creds = Realm.Credentials.emailPassword(
    'arman@techteampartners.com',
    'asdfasdf1',
)

const newObjSchema = schemaClassArray
  .filter(classType => !['Change', 'ChangeSession'].includes(classType.name))
  .map(classType => {
    const newClassDef = {
      ...classType,
      properties: {
        ...classType.properties,
        syncDate: 'date?'
      }
    };
    if (classType.primaryKey) { 
      delete newClassDef.properties[classType.primaryKey];
      delete newClassDef.primaryKey;
      newClassDef.properties.tempPk = 'string';
      newClassDef.primaryKey = 'tempPk';
    }
    return newClassDef;
  });

const getClassArrayProperties = className =>
  Object.entries(schema[className].properties)
    .reduce((agg, [propertyName, type]) => {
      if (typeof type === 'string' && type.includes('[]')) {
        agg.push([propertyName, type.replace('[]', '')])
      }
      return agg;
    }, []);

const getRealm = async (name, fullSync) => {
  if (realm) {
    return realm;
  }
  try {
    const user = await app.logIn(creds);
    console.log('user logged in', user);
    const config = {
      schema: schemaClassArray,
      deleteRealmIfMigrationNeeded: true,
      sync: {
        user: app.currentUser,
        partitionValue: 'S0013',
      }
    };
    realm = await Realm.open(config);
    console.log('realm opened');
    return realm;
  } catch (err) {
    console.log(err);
  }
}

const getNewObjectRealm = async (name, fullSync) => {
  if (newObjectRealm) {
    return newObjectRealm;
  }
  try {
    const user = await app.logIn(creds);
    console.log('user logged in', user);
    const config = {
      schema: newObjSchema,
      deleteRealmIfMigrationNeeded: true,
      sync: {
        // url: `${realmObjectServer.rosUrl}/${name}`,
        // fullSynchronization: fullSync,
        user: app.currentUser,
        partitionValue: 'asCode',
      }
    };
    newObjectRealm = await Realm.open(config);
    console.log('new object realm opened');
    return newObjectRealm;
  } catch (err) {
    console.log(err);
  }
}

const getPropertyId = object => {
  if (object.pid) {
    return object.pid;
  } else if (object.pID) {
    return object.pID;
  }
}

const getParentFk = (className, object) => {
  const classObj = schema[className];
  const parentPk = classObj.primaryKey;
  if (parentPk === '_id' && object.pID) {
    return object.pID;
  }
  return object[parentPk];
}

const getObjectPk = (className, object) =>
  object[schema[className].primaryKey];

const getParentListKeyByClass = className => {
  const classObj = schema[className];
  if (!classObj) return;
  return Object.values(classObj.properties)
    .find(v => typeof v === 'object' && v.type === 'linkingObjects');
}

const writeToRealm = (realm, className, objects, delay = 0) =>
  new Promise((resolve, reject) => {
    const count = objects.length;
    const parentListKey = getParentListKeyByClass(className);
    console.log(
      `Writing ${count} objects for class ${className}`,
      parentListKey 
        ? ` and writing to ${_.get(parentListKey, 'objectType')}.` +
          `${_.get(parentListKey, 'property')}`
        : '.'
    );
    try {
      realm.write(() => {
        objects.forEach((item, i) => {
          if (typeof item === 'object'){
            if (className === 'Property') {
              console.log(item._id)
              realm.create('Property', item, true);
            } else if (parentListKey && parentListKey.objectType) {
              console.log(
                parentListKey.objectType,
                getParentFk(parentListKey.objectType, item),
              );
              const parent = realm.objectForPrimaryKey(
                parentListKey.objectType,
                getParentFk(parentListKey.objectType, item),
              );
              parent[parentListKey.property].push(item);
            } else {
              realm.create(className, item, true);
            }
          } 
          if (i % (count / 10) === 0) {
            const pct = 100 * i / objects.length;
            console.log(`Data import completion: ${pct.toFixed(0)}%`);
          }
        });
      });
      console.log(`Waiting for ${delay/1000} seconds`)
      setTimeout(() => resolve(), delay);
    } catch (err) {
      reject(err);
    }
  });

const insertInRealm = async (realmName, className, objects) => {
  console.log(`INSERT ${objects.length} objects in ${className}.`);
  const realm = await getRealm(realmName, true);
  await writeToRealm(realm, className, objects)
}

const updateInRealm = async (realmName, className, objects) => {
  try {
    const realm = await getRealm(realmName, true);
    console.log(`UPDATE ${objects.length} objects in ${className}.`);
    console.log(objects)
    realm.write(() => {
      for (const object of objects) {
        const realmObj = realm.objectForPrimaryKey(
          className,
          getObjectPk(className, object)
        );
        if (realmObj) {
          for (const key of Object.keys(object)) {
            if (key !== schema[className].primaryKey) {
              realmObj[key] = object[key];
            }
          }
        } else {
          console.log('Object not found in this realm');
        }
      }
    });
  } catch(err) {
    console.log(err);
  }
}

const deleteInRealm = async (realmName, realmClass, objects) => {
  console.log(`DELETE ${objects.length} objects in ${realmClass.name}.`);
  try {
    const realm = await getRealm(realmName, true);
    const className = realmClass.name;
    objects.forEach (object =>
      realm.write(() => {
        if (className === 'Property') {
          const property = realm.objectForPrimaryKey(
            className,
            getPropertyId(object)
          );
          realm.delete(property);
        } else {
          const pk = realmClass.primaryKey;
          let item = realm.objectForPrimaryKey(
            className,
            object[pk]
          );
          if (item) {
            realm.delete(item);
          } else {
            console.log('Object was not present in realm, probably deleted on mobile first')
          }
        }
      })
    );
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  getParentListKeyByClass,
  getClassArrayProperties,
  getRealm,
  getNewObjectRealm,
  getPropertyId,
  writeToRealm,
  insertInRealm,
  updateInRealm,
  deleteInRealm,
}
