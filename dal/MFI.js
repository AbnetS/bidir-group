////////   MFI DATA ACCESS LAYER   /////////////////

//Load Module Dependencies
var mongoose = require ('mongoose');
var debug = require ('debug') ('Bidir-api-mfi-dal')
var moment = require ('moment');

var mfiModel 	= require ('../models/MFI');
var enums		= require ('../lib/enums');
var CustomError     = require('../lib/custom-error');


var returnFields = mfiModel.whitelist;
var population	 = [];

//A method to create a mfi document in Mfis collection of the Bidir DB
//cb is supposed to have two arguments: err, savedMfi
exports.create = function createMfi (mfiData, cb){
	debug ('Creating a mfi');

	//Step 1 - create the mfi instance/document/ that is to be saved to the database
	var mfi = new mfiModel (mfiData);

	//Step 2 - Call the save method of the mongoose model to add the instance to the 'Mfis' collection
	mfi.save (function afterSave (err, savedMfi){
		if (err){
			return cb (err);
		};

		return cb (null, savedMfi);

	});
};

//A method to get a single mfi based on query
exports.get = function getMfi (query, cb){
	debug ('Getting a mfi');

	mfiModel
		.findOne(query, returnFields)
		.populate (population)
		.select (returnFields)	
		.exec (function afterSearch (err, searchedMfi){
				if (err){
					return cb (err);
				}				

				cb (null, searchedMfi  || {});
			});
}

exports.getCollection = function getMfis (query, cb){
	debug ('getting mfis');

	mfiModel
		.find(query)
		.populate (population)
		.select (returnFields)		
		.exec (function afterSearch (err, searchedMfis){
				if (err){
					return cb (err);
				}

				cb (null, searchedMfis  || {});
			});
};

exports.getCollectionByPagination = function getCollection(query, qs, cb) {
  debug('fetching a collection of MFIs');

  var opts = {
    columns:  returnFields,
    sortBy:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    Number(qs.limit)
  };
console.log(opts)



  mfiModel.paginate(query, opts, function (err, docs, page, count) {
    if(err) {
      return cb(err);
    }


    var data = {
      total_pages: page,
      total_docs_count: count,
      docs: docs
    };

    cb(null, data);

  });

};


exports.update = function updateMfi (query, update, cb){
	debug ('Updating Mfi: ', query);

	mfiModel
		.findOneAndUpdate (query, update, {new:true})
		.select (returnFields)
		.exec (function updateMfi (err,mfi){
			if (err){
				return cb (err)
			}			

			cb (null, mfi || {});
		});
}

exports.delete = function deleteMfi (query, cb){
 	debug ('Deleting Mfi: ', query);

	 mfiModel
        .findOne(query)
        .select (returnFields)
        .exec(function afterSearch (err, searchedMfi){
            if (err){
              return cb (err);				
            }
            if (!searchedMfi){
                return cb (null, {});
            }
            else{
                searchedMfi.remove(function afterRemove(err){
                    if (err){
                        return cb (err);
                    }
                    return cb(null,searchedMfi);
                }) 
            }
			
			
	 });
};


exports.deleteAll = function deleteAllMfis (cb){
	debug ('Deleting All Mfis: ');

	mfiModel.remove ({}, function afterRemove(err){
		if (err){
			return cb (err);
		}		
		return cb (null);

	})
}

exports.getCount = function getMfisCount (query, cb){
	debug ('counting and returning the total number of MFIs....');

	mfiModel.count (query, function (err, count){
		if (err){
			return cb (err);
		}

		cb (null, count);

	})
} 

