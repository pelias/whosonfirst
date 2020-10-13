// Property to determine if the importer should be run against the Pelias ES index that contains the polygon geo-shape data.
global.geo_shape_polygon=true;

// Validation for constants
if(global.geo_shape_polygon === true || global.geo_shape_polygon === false){
  console.log('\n Running the importer against the ES index that contains the polygon geo-shape data: ' + global.geo_shape_polygon + '.');
}else{
  console.error('The global.geo_shape_polygon property in the global_const.js file has not been correctly configured.\n');
  console.error('\nPlease set this value to true or false and try again.');
  process.exit(1);
}
