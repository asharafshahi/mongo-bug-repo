'use strict';

const { getRealm, getNewObjectRealm, writeToRealm } = require('./realm');
// const queries = require('./dataAccess/queries');
// const { syncMappings, DB_SCHEMA } = require('./mySqlSchema');

// const { initialLoadTables, tableClassMapping } = syncMappings;

// const getDbData = (table, asCodes) => {
//   const map = {
//     [`${DB_SCHEMA}.propertySearchVw`]: queries.getProperties,
//     [`${DB_SCHEMA}.propertyNotes`]: queries.getPropertyNotes,
//     [`${DB_SCHEMA}.situsAddress`]: queries.getSitusAddresses,
//     [`${DB_SCHEMA}.valuations`]: queries.getValuations,
//     [`${DB_SCHEMA}.valuationsCostApproach`]: queries.getValuationsCostApproach,
//     [`${DB_SCHEMA}.improvement`]: queries.getImprovement,
//     [`${DB_SCHEMA}.land`]: queries.getLand,
//     [`${DB_SCHEMA}.improvementNote`]: queries.getImprovementNotes,
//     [`${DB_SCHEMA}.landNote`]: queries.getLandNotes,
//     [`${DB_SCHEMA}.improvementDetail`]: queries.getImprovementDetails,
//     [`${DB_SCHEMA}.codefile`]: queries.getCodefile,
//     [`${DB_SCHEMA}.model`]: queries.getModel,
//   };

//   return map[table](asCodes);
// }

const loadDataFromDb = async ({
  realmName,
  fullSync,
  asCodes
}) => {
  try {
    await getRealm(realmName, fullSync)
  } catch (err) {
    console.log(err)
  }
}

loadDataFromDb({
  realmName: 'dbTest_dev1',
  fullSync: true,
  asCodes: ['S0013' ] //, 'S0014' ] , 'S0015', 'S0015'],
});
