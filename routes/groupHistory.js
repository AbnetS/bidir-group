'use strict';
/**
 * Load Module Dependencies.
 */
const Router  = require('koa-router');
const debug   = require('debug')('api:group history-router');

const historyController  = require('../controllers/groupHistory');
const authController     = require('../controllers/auth');

const acl               = authController.accessControl;
var router  = Router();


/**
 * @api {get} /groups/histories/paginate?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Get histories collection
 * @apiVersion 1.0.0
 * @apiName FetchPaginated
 * @apiGroup History
 *
 * @apiDescription Get a collection of histories. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`.
 *
 * @apiSuccess {String} _id history id
 * @apiSuccess {String} group Group ID
 * @apiSuccess {String} branch Group branch 
 * @apiSuccess {String} cycle_number Cycle number of the group * 
 * @apiSuccess {Object[]} cycles Loan cycle details of each loan cycle
 * @apiSuccess {Number} cycles.cycle_number Cycle number
 * @apiSuccess {Number} cycles.total_amount Total amount requested by the group/Sum of loan requested for each member/
 * @apiSuccess {Number} cycles.total_granted_amount Total granted amount for the group
 * @apiSuccess {Number} cycles.total_paid_amount Total paid amount for the group
 * @apiSuccess {Object} cycles.screening Group screening for this cycle
 * @apiSuccess {Object} cycles.loan Group loan for this cycle
 * @apiSuccess {Object} cycles.acat Group ACAT for this cycle
 * @apiSuccess {String} cycles.started_by User who started the cycle
 * @apiSuccess {String} cycles.last_edit_by User who last edited
 * @apiSuccess {String} cycles.status Status of he cycle
 * 
 *
 * @apiSuccessExample Response Example:
 *  {
        "total_pages": 1,
        "total_docs_count": 1,
        "current_page": 1,
        "docs": [
            {
                "_id": "5df3a2705ecb2f1030633781",
                "last_modified": "2019-12-15T09:30:30.924Z",
                "date_created": "2019-12-13T14:38:40.862Z",
                "group": {
                    "_id": "5df3a2705ecb2f103063377f",
                    ...
                },
                "branch": {
                    "_id": "5b9283679fb7f20001f1494d",
                    ...
                },
                "cycle_number": 1,
                "cycles": [
                    {
                        "loan": {
                            "_id": "5df556551753a050f48647f5",
                            ...
                        },
                        "acat": {
                            "_id": "5df5fd367e596238bc1ed0bd",
                            ...
                        },
                        "screening": {
                            "_id": "5df3a2705ecb2f1030633780",
                            ...
                        },
                        "started_by": {
                            "_id": "5c5aadf6b711700001a016d7",
                            ...
                        },
                        "last_edit_by": {
                            "_id": "5c5aadf6b711700001a016d7",
                            ...
                        },
                        "_id": "5df60e4c7588ef3b287f69ab",
                        "total_paid_amount": 0,
                        "total_granted_amount": 0,
                        "total_amount": 0,
                        "cycle_number": 1
                    }
                ]
            }
        }
 *  }
 */
router.get('/paginate', acl(['*']), historyController.fetchAllByPagination);


/**
 * 
 * @api {get} /groups/histories/search?search?group=ID&&loanCycle=Number&&application=screening|loan|acat Search Group Loan History
 * @apiVersion 1.0.0
 * @apiName Search
 * @apiGroup History
 *
 * 
 * @apiDescription Search History. Searches loan history of a group. Providing group reference is mandatory.
 * 
 * @apiExample Usage Example
 * api.test.bidir.gebeya.co/groups/histories/search?group=5df3a2705ecb2f103063377f
 * api.test.bidir.gebeya.co/groups/histories/search?group=5df3a2705ecb2f103063377f&loanCycle=1
 * api.dev.bidir.gebeya.co/groups/histories/search?application=screening&group=5df3a2705ecb2f103063377f&loanCycle=1
 * 
 * @apiSuccess Object Depends on the parameters of the request.
 *                    If parameter is only group, the whole history is returned
 *                    If parameters are group and loanCycle, the specific cycle is returned.
 *                    If parameters are group, loanCycle and application, either group screening, group loan
 *                    or group acat are returned depending on the values of application parameter.
 */
router.get('/search', acl(['*']), historyController.search);

module.exports = router;