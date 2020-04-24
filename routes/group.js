'use strict';
/**
 * Load Module Dependencies.
 */
const Router  = require('koa-router');
const debug   = require('debug')('api:group-router');

const groupController           = require('../controllers/group');
const groupScreeningController  = require('../controllers/groupScreening');
const groupLoanController       = require('../controllers/groupLoan');
const groupACATController       = require('../controllers/groupACAT');
const authController            = require('../controllers/auth');

const acl               = authController.accessControl;
var router  = Router();

/**
 * @api {post} /groups/create Create new Group
 * @apiVersion 1.0.0
 * @apiName Create
 * @apiGroup Group
 *
 * @apiDescription Create a new Group. 
 *
 * @apiParam {String} name Group name
 * @apiParam {String} branch Group branch
 * @apiParam {Number} no_of_members The number of members in a group
 * @apiParam {Number} total_amount Total amount 
 *
 * @apiParamExample Request Example:
 *  {
        "name": "Unity",
        "branch": "5b9283679fb7f20001f1494d",
        "no_of_members": 4,
        "total_amount": 500000
 *  }
 *
 * @apiSuccess {String} _id Group id
 * @apiSuccess {String} name Group name
 * @apiSuccess {String} no_of_members Number of members in a group
 * @apiSuccess {Object[]} members Members of a group
 * @apiSuccess {Object} leader Leader member
 * @apiSuccess {Object} branch Group branch
 * @apiSuccess {Number} total_amount Total loan amount
 * @apiSuccess {Number} total_granted_amount Total granted loan amount
 * @apiSuccess {Number} total_paid_amount Total paid loan amount
 * @apiSuccess {Number} loan_cycle_number Loan cycle number, 1 for a newly created group
 * @apiSuccess {String} status Status of the group, default to 'new' for a newly created group
 * @apiSuccess {String} created_by Officer Account registering this
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5df3a2705ecb2f103063377f",
        "last_modified": "2019-12-13T14:38:40.772Z",
        "date_created": "2019-12-13T14:38:40.772Z",
        "branch": {
            "_id": "5b9283679fb7f20001f1494d",
            "last_modified": "2019-02-14T09:12:27.429Z",
            "date_created": "2018-09-07T13:55:51.227Z",
            "name": "Test Branch",
            "location": "test",
            "phone": "",
            "email": "",
            "branch_type": "Satellite office",
            "opening_date": "1970-01-01T00:00:00.000Z",
            "status": "active"
        },
        "created_by": {
            "_id": "5c5aadf6b711700001a016d7",
            "last_login": "2019-02-27T16:40:53.386Z",
            "last_modified": "2019-02-27T16:40:53.386Z",
            "date_created": "2019-02-06T09:50:46.487Z",
            "username": "test@meki.com",
            "created_by": "super@bidir.com",
            "account": "5c5aadf6b711700001a016d8",
            "archived": false,
            "status": "active",
            "role": "Senior_Officer",
            "realm": "user"
        },
        "loan_cycle_number": 1,
        "status": "new",
        "total_paid_amount": 0,
        "total_granted_amount": 0,
        "total_amount": 500000,
        "leader": null,
        "members": [],
        "no_of_members": 4,
        "name": "Unity"
 *  }
 *
 */
router.post('/create', acl(['*']), groupController.create);

/**
 * @api {get} /groups/:id Get Group
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Group
 *
 * @apiDescription Get a group with the given id
 *
 * @apiSuccess {String} _id Group id
 * @apiSuccess {String} name Group name
 * @apiSuccess {String} no_of_members Number of members in a group
 * @apiSuccess {Object[]} members Members of a group
 * @apiSuccess {Object} leader Leader member
 * @apiSuccess {Object} branch Group branch
 * @apiSuccess {Number} total_amount Total loan amount
 * @apiSuccess {Number} total_granted_amount Total granted loan amount
 * @apiSuccess {Number} total_paid_amount Total paid loan amount
 * @apiSuccess {Number} loan_cycle_number Loan cycle number, 1 for a newly created group
 * @apiSuccess {String} status Status of the group, default to 'new' for a newly created group
 * @apiSuccess {String} created_by Officer Account registering this
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5df3a2705ecb2f103063377f",
        "last_modified": "2019-12-13T14:38:40.772Z",
        "date_created": "2019-12-13T14:38:40.772Z",
        "branch": {
            "_id": "5b9283679fb7f20001f1494d",
            "last_modified": "2019-02-14T09:12:27.429Z",
            "date_created": "2018-09-07T13:55:51.227Z",
            "name": "Test Branch",
            "location": "test",
            "phone": "",
            "email": "",
            "branch_type": "Satellite office",
            "opening_date": "1970-01-01T00:00:00.000Z",
            "status": "active"
        },
        "created_by": {
            "_id": "5c5aadf6b711700001a016d7",
            "last_login": "2019-02-27T16:40:53.386Z",
            "last_modified": "2019-02-27T16:40:53.386Z",
            "date_created": "2019-02-06T09:50:46.487Z",
            "username": "test@meki.com",
            "created_by": "super@bidir.com",
            "account": "5c5aadf6b711700001a016d8",
            "archived": false,
            "status": "active",
            "role": "Senior_Officer",
            "realm": "user"
        },
        "loan_cycle_number": 1,
        "status": "new",
        "total_paid_amount": 0,
        "total_granted_amount": 0,
        "total_amount": 500000,
        "leader": null,
        "members": [],
        "no_of_members": 4,
        "name": "Unity"
 *  }
 *
 */
router.get('/:id', acl(['*']), groupController.fetchOne);

/**
 * @api {get} /groups/paginate?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Get groups collection
 * @apiVersion 1.0.0
 * @apiName FetchPaginated
 * @apiGroup Group
 *
 * @apiDescription Get a collection of groups. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`.
 *
 * @apiSuccess {String} _id Group id
 * @apiSuccess {String} name Group name
 * @apiSuccess {String} no_of_members Number of members in a group
 * @apiSuccess {Object[]} members Members of a group
 * @apiSuccess {Object} leader Leader member
 * @apiSuccess {Object} branch Group branch
 * @apiSuccess {Number} total_amount Total loan amount
 * @apiSuccess {Number} total_granted_amount Total granted loan amount
 * @apiSuccess {Number} total_paid_amount Total paid loan amount
 * @apiSuccess {Number} loan_cycle_number Loan cycle number, 1 for a newly created group
 * @apiSuccess {String} status Status of the group, default to 'new' for a newly created group
 * @apiSuccess {String} created_by Officer Account registering this
 *
 * @apiSuccessExample Response Example:
 *  {
        "total_pages": 1,
        "total_docs_count": 5,
        "current_page": 1,
        "docs": [
            {
                "_id": "5c5ab6b452edb300017b8981",
                ...
            },
            {
                ...
            }...
        ]
 *  }
 */
router.get('/paginate', acl(['*']), groupController.fetchAllByPagination);




/**
 * @api {put} /groups/:id Update Group
 * @apiVersion 1.0.0
 * @apiName Update
 * @apiGroup Group 
 *
 * @apiDescription Update a Group group with the given id
 *
 * @apiParam {Object} Data Update data
 *
 * @apiParamExample Request example:
 * {
        "total_amount": 600000
 * }
 *
 * @apiSuccess {String} _id Group id
 * @apiSuccess {String} name Group name
 * @apiSuccess {String} no_of_members Number of members in a group
 * @apiSuccess {Object[]} members Members of a group
 * @apiSuccess {Object} leader Leader member
 * @apiSuccess {Object} branch Group branch
 * @apiSuccess {Number} total_amount Total loan amount
 * @apiSuccess {Number} total_granted_amount Total granted loan amount
 * @apiSuccess {Number} total_paid_amount Total paid loan amount
 * @apiSuccess {Number} loan_cycle_number Loan cycle number, 1 for a newly created group
 * @apiSuccess {String} status Status of the group, default to 'new' for a newly created group
 * @apiSuccess {String} created_by Officer Account registering this
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5df3a2705ecb2f103063377f",
        "last_modified": "2019-12-13T14:38:40.772Z",
        "date_created": "2019-12-13T14:38:40.772Z",
        "branch": {
            "_id": "5b9283679fb7f20001f1494d",
            "last_modified": "2019-02-14T09:12:27.429Z",
            "date_created": "2018-09-07T13:55:51.227Z",
            "name": "Test Branch",
            "location": "test",
            "phone": "",
            "email": "",
            "branch_type": "Satellite office",
            "opening_date": "1970-01-01T00:00:00.000Z",
            "status": "active"
        },
        "created_by": {
            "_id": "5c5aadf6b711700001a016d7",
            "last_login": "2019-02-27T16:40:53.386Z",
            "last_modified": "2019-02-27T16:40:53.386Z",
            "date_created": "2019-02-06T09:50:46.487Z",
            "username": "test@meki.com",
            "created_by": "super@bidir.com",
            "account": "5c5aadf6b711700001a016d8",
            "archived": false,
            "status": "active",
            "role": "Senior_Officer",
            "realm": "user"
        },
        "loan_cycle_number": 1,
        "status": "new",
        "total_paid_amount": 0,
        "total_granted_amount": 0,
        "total_amount": 600000,
        "leader": null,
        "members": [],
        "no_of_members": 4,
        "name": "Unity"
 *  }
 */
router.put('/:id', acl(['*']), groupController.update);

/**
 * @api {put} /groups/:id/members Update Group Members
 * @apiVersion 1.0.0
 * @apiName UpdateMembers
 * @apiGroup Group 
 *
 * @apiDescription Add members in a group with the given id. It also creates screening for each member as well as screening for the group.
 *
 * @apiParam {Object[]} members Member Ids array
 *
 * @apiParamExample Request example:
 * {
        "members": ["5df4dc3d7c604a3508fb7376",
				    "5df4dcc57c604a3508fb7398",
				    "5df4dd077c604a3508fb73ba"]
 * }
 *
 * @apiSuccess {String} _id Group id
 * @apiSuccess {String} name Group name
 * @apiSuccess {String} no_of_members Number of members in a group
 * @apiSuccess {Object[]} members Members of a group
 * @apiSuccess {Object} leader Leader member
 * @apiSuccess {Object} branch Group branch
 * @apiSuccess {Number} total_amount Total loan amount
 * @apiSuccess {Number} total_granted_amount Total granted loan amount
 * @apiSuccess {Number} total_paid_amount Total paid loan amount
 * @apiSuccess {Number} loan_cycle_number Loan cycle number, 1 for a newly created group
 * @apiSuccess {String} status Status of the group, default to 'new' for a newly created group
 * @apiSuccess {String} created_by Officer Account registering this
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5df3a2705ecb2f103063377f",
        "last_modified": "2019-12-14T16:27:36.529Z",
        "date_created": "2019-12-13T14:38:40.772Z",
        "branch": {
            "_id": "5b9283679fb7f20001f1494d",
            "last_modified": "2019-02-14T09:12:27.429Z",
            "date_created": "2018-09-07T13:55:51.227Z",
            "name": "Test Branch",
            "location": "test",
            "phone": "",
            "email": "",
            "branch_type": "Satellite office",
            "opening_date": "1970-01-01T00:00:00.000Z",
            "status": "active"
        },
        "created_by": {
            "_id": "5c5aadf6b711700001a016d7",
            "last_login": "2019-02-27T16:40:53.386Z",
            "last_modified": "2019-02-27T16:40:53.386Z",
            "date_created": "2019-02-06T09:50:46.487Z",
            "username": "test@meki.com",
            "created_by": "super@bidir.com",
            "account": "5c5aadf6b711700001a016d8",
            "archived": false,
            "status": "active",
            "role": "Senior_Officer",
            "realm": "user"
        },
        "loan_cycle_number": 1,
        "status": "new",
        "total_paid_amount": 0,
        "total_granted_amount": 0,
        "total_amount": 600000,
        "leader": null,
        "members": [
            {
                "_id": "5df4dc3d7c604a3508fb7376",
                ...
            },
            {
                "_id": "5df4dcc57c604a3508fb7398",
                ...
            },
            {
                "_id": "5df4dd077c604a3508fb73ba",
                ...
            }
        ],
    "no_of_members": 3,
    "name": "Unity"
 *  }
 */
router.put('/:id/members', acl(['*']), groupController.addMembers);

/**
 * @api {put} /groups/:id/leader Update Group Leader
 * @apiVersion 1.0.0
 * @apiName UpdateLeader
 * @apiGroup Group 
 *
 * @apiDescription Update a Group Leader with the given id
 *
 * @apiParam {String} leader Leader Id. The ID should belong to one of the members.
 *
 * @apiParamExample Request example:
 * {
        "leader": "5df4dc3d7c604a3508fb7376"
 * }
 *
 * @apiSuccess {String} _id Group id
 * @apiSuccess {String} name Group name
 * @apiSuccess {String} no_of_members Number of members in a group
 * @apiSuccess {Object[]} members Members of a group
 * @apiSuccess {Object} leader Leader member
 * @apiSuccess {Object} branch Group branch
 * @apiSuccess {Number} total_amount Total loan amount
 * @apiSuccess {Number} total_granted_amount Total granted loan amount
 * @apiSuccess {Number} total_paid_amount Total paid loan amount
 * @apiSuccess {Number} loan_cycle_number Loan cycle number, 1 for a newly created group
 * @apiSuccess {String} status Status of the group, default to 'new' for a newly created group
 * @apiSuccess {String} created_by Officer Account registering this
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5df3a2705ecb2f103063377f",
        "last_modified": "2019-12-14T16:32:33.834Z",
        "date_created": "2019-12-13T14:38:40.772Z",
        "branch": {
            "_id": "5b9283679fb7f20001f1494d",
            "last_modified": "2019-02-14T09:12:27.429Z",
            "date_created": "2018-09-07T13:55:51.227Z",
            "name": "Test Branch",
            "location": "test",
            "phone": "",
            "email": "",
            "branch_type": "Satellite office",
            "opening_date": "1970-01-01T00:00:00.000Z",
            "status": "active"
        },
        "created_by": {
            "_id": "5c5aadf6b711700001a016d7",
            "last_login": "2019-02-27T16:40:53.386Z",
            "last_modified": "2019-02-27T16:40:53.386Z",
            "date_created": "2019-02-06T09:50:46.487Z",
            "username": "test@meki.com",
            "created_by": "super@bidir.com",
            "account": "5c5aadf6b711700001a016d8",
            "archived": false,
            "status": "active",
            "role": "Senior_Officer",
            "realm": "user"
        },
        "loan_cycle_number": 1,
        "status": "new",
        "total_paid_amount": 0,
        "total_granted_amount": 0,
        "total_amount": 600000,
        "leader": {
            "_id": "5df4dc3d7c604a3508fb7376",
            ...
        },
        "members": [
            {
                "_id": "5df4dc3d7c604a3508fb7376",
            },
            {
                ....
            }
                ...
        },
        "no_of_members": 3,
        "name": "Unity"
 *  }
 */
router.put('/:id/leader', acl(['*']), groupController.addLeader);

/**
 * /**
 * @api {put} /groups/:id/status Update Group Status
 * @apiVersion 1.0.0
 * @apiName UpdateStatus
 * @apiGroup Group 
 *
 * @apiDescription Update status for the given group. If status 
 *                 is NOT sent in the body of the request, status value
 *                 will be determined based on the status of each member
 *
 * @apiParam {String} [status] Status. 
 *  
 *
 * @apiSuccess {String} _id Group id
 * @apiSuccess {String} name Group name
 * @apiSuccess {String} no_of_members Number of members in a group
 * @apiSuccess {Object[]} members Members of a group
 * @apiSuccess {Object} leader Leader member
 * @apiSuccess {Object} branch Group branch
 * @apiSuccess {Number} total_amount Total loan amount
 * @apiSuccess {Number} total_granted_amount Total granted loan amount
 * @apiSuccess {Number} total_paid_amount Total paid loan amount
 * @apiSuccess {Number} loan_cycle_number Loan cycle number, 1 for a newly created group
 * @apiSuccess {String} status Status of the group, default to 'new' for a newly created group
 * @apiSuccess {String} created_by Officer Account registering this
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5df3a2705ecb2f103063377f",
        "last_modified": "2019-12-14T16:32:33.834Z",
        "date_created": "2019-12-13T14:38:40.772Z",
        "branch": {
            "_id": "5b9283679fb7f20001f1494d",
            "last_modified": "2019-02-14T09:12:27.429Z",
            "date_created": "2018-09-07T13:55:51.227Z",
            "name": "Test Branch",
            "location": "test",
            "phone": "",
            "email": "",
            "branch_type": "Satellite office",
            "opening_date": "1970-01-01T00:00:00.000Z",
            "status": "active"
        },
        "created_by": {
            "_id": "5c5aadf6b711700001a016d7",
            "last_login": "2019-02-27T16:40:53.386Z",
            "last_modified": "2019-02-27T16:40:53.386Z",
            "date_created": "2019-02-06T09:50:46.487Z",
            "username": "test@meki.com",
            "created_by": "super@bidir.com",
            "account": "5c5aadf6b711700001a016d8",
            "archived": false,
            "status": "active",
            "role": "Senior_Officer",
            "realm": "user"
        },
        "loan_cycle_number": 1,
        "status": "loan_granted",
        "total_paid_amount": 0,
        "total_granted_amount": 0,
        "total_amount": 600000,
        "leader": {
            "_id": "5df4dc3d7c604a3508fb7376",
            ...
        },
        "members": [
            {
                "_id": "5df4dc3d7c604a3508fb7376",
            },
            {
                ....
            }
                ...
        },
        "no_of_members": 3,
        "name": "Unity"
 *  }
 */
router.put('/:id/status', acl(['*']), groupController.updateStatus); 

/**
 * @api {put} /groups/printout/:id Generate Memberlist printout
 * @apiVersion 1.0.0
 * @apiName GeneratePrintOut
 * @apiGroup Group
 *
 * @apiDescription Generates and returns a report listing members of a group
 * 
 * @apiSuccess file A Microsoft Excel file /Members list report/
 * 
 * 
 * 
 **/
router.get('/printout/:id', groupController.generateMembersList);

/********************************************************************** */

/**
 * @api {get} /groups/:id/screenings Get Group Screening
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Group Screening
 *
 * @apiDescription Get a group screening for the given group
 * 
 * @apiExample Usage Example
 * api.test.bidir.gebeya.co/groups/5df3a2705ecb2f103063377f/screenings
 *
 * @apiSuccess {String} _id group screening id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} screenings Screenings of all members
 * @apiSuccess {String} status Status of the group
 
 *
 * @apiSuccessExample Response Example:
 {
    "_id": "5df3a2705ecb2f1030633780",
    "last_modified": "2019-12-14T16:27:36.446Z",
    "date_created": "2019-12-13T14:38:40.800Z",
    "group": {
        "_id": "5df3a2705ecb2f103063377f",
        ...
    },
    "screenings": [
        {
            "_id": "5df4dc3e7c604a3508fb7396",
            "last_modified": "2019-12-14T16:27:36.326Z",
            "date_created": "2019-12-14T12:57:34.011Z",
            "client": {
                "_id": "5df4dc3d7c604a3508fb7376",
                ...
            },
            "created_by": "5b925494b1cfc10001d80908",
            "branch": "5b9283679fb7f20001f1494d",
            "comment": "",
            "status": "new",
            "questions": [
                {
                    "_id": "5df4dc3d7c604a3508fb7377",
                    "question_text": "Where is the farmer's permanent residence?",
                    ...
                }...
            ],
            "disclaimer": "",
            "signatures": [
                "Applicant",
                "Filled By",
                "Checked By"
            ],
            "sections": [],
            "has_sections": false,
            "layout": "THREE_COLUMNS",
            "for_group": true,
            "purpose": "Screening Application For Addis Samson",
            "subtitle": "",
            "title": "Client Screening Form"
        },
        {
            "_id": "5df4dcc57c604a3508fb73b8",
            ...
        },
        {
            "_id": "5df4dd077c604a3508fb73da",
            ...
        }
    ],
    "status": "new"     
     
 }
 *
 */

router.get('/:id/screenings', acl(['*']), groupScreeningController.fetchOne);

/**
 * @api {get} /groups/:id/screenings/status Update Group Screening Status
 * @apiVersion 1.0.0
 * @apiName Update Status
 * @apiGroup Group Screening
 *
 * @apiDescription Update group screening status for the given group. 
 *                 This endpoint inspects status of each member and changes the status of the group screening
 *                 to an appropriate value.
 * 
 * @apiExample Usage Example
 * api.test.bidir.gebeya.co/groups/5df3a2705ecb2f103063377f/screenings/status
 *
 * @apiSuccess {String} _id group screening id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} screenings Screenings of all members
 * @apiSuccess {String} status Status of the group
 * 
 * @apiSuccessExample Response Example:
 {
    "_id": "5df3a2705ecb2f1030633780",
    "last_modified": "2019-12-14T16:27:36.446Z",
    "date_created": "2019-12-13T14:38:40.800Z",
    "group": {
        "_id": "5df3a2705ecb2f103063377f",
        ...
    },
    "screenings": [
        {
            "_id": "5df4dc3e7c604a3508fb7396",
            ...
        },
        {
            "_id": "5df4dcc57c604a3508fb73b8",
            ...
        },
        {
            "_id": "5df4dd077c604a3508fb73da",
            ...
        }
    ],
    "status": "screening_inprogress"      
     
 }
 * 
 */
router.put('/:id/screenings/status', acl(['*']), groupScreeningController.updateStatus);

/**
 * @api {put} /groups/:id/screenings/submit Submit Group Screening
 * @apiVersion 1.0.0
 * @apiName Submit
 * @apiGroup Group Screening
 *
 * @apiDescription Submit a group screening for the given group. Group screening
 *                 will be submitted if all members screenings are submitted. Otherwise,
 *                 appropriate status value will be assigned to the group screening. 
 *                 The status of the group will also be changed accordingly.
 *
 * @apiExample Usage Example
 * api.test.bidir.gebeya.co/groups/5df3a2705ecb2f103063377f/screenings/submit
 *
 * @apiSuccess {String} _id group screening id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} screenings Screenings of all members
 * @apiSuccess {String} status Status of the group
 *
 * @apiSuccessExample Response Example:
 {
    "_id": "5df3a2705ecb2f1030633780",
    "last_modified": "2019-12-14T16:27:36.446Z",
    "date_created": "2019-12-13T14:38:40.800Z",
    "group": {
        "_id": "5df3a2705ecb2f103063377f",
        ...
    },
    "screenings": [
        {
            "_id": "5df4dc3e7c604a3508fb7396",
            ...
        },
        {
            "_id": "5df4dcc57c604a3508fb73b8",
            ...
        },
        {
            "_id": "5df4dd077c604a3508fb73da",
            ...
        }
    ],
    "status": "submitted"     
}
 *
 */
router.put('/:id/screenings/submit', acl(['*']), groupScreeningController.submit);

/**
 * @api {put} /groups/:id/screenings/approve Approve Group Screening
 * @apiVersion 1.0.0
 * @apiName Approve
 * @apiGroup Group Screening
 *
* @apiDescription Approve/decline a group screening for the given group. Group screening
 *                 will be approved/declined based on the screening status of each member.
 *                 Otherwise, appropriate status value will be assigned to the group screening.
 *                 The status of the group will also be changed accordingly.
 * 
 * 
 * @apiExample Usage Example
 * api.test.bidir.gebeya.co/groups/5df3a2705ecb2f103063377f/screenings/approve
 *
 * @apiSuccess {String} _id group screening id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} screenings Screenings of all members
 * @apiSuccess {String} status Status of the group
 *
 * @apiSuccessExample Response Example:
 {
    "_id": "5df3a2705ecb2f1030633780",
    "last_modified": "2019-12-14T16:27:36.446Z",
    "date_created": "2019-12-13T14:38:40.800Z",
    "group": {
        "_id": "5df3a2705ecb2f103063377f",
        "status": "screening_inprogress"
        ...
    },
    "screenings": [
        {
            "_id": "5df4dc3e7c604a3508fb7396",            
            ...
        },
        {
            "_id": "5df4dcc57c604a3508fb73b8",
            ...
        },
        {
            "_id": "5df4dd077c604a3508fb73da",
            ...
        }
    ],
    "status": "declined_under_review"   
}
*/
router.put('/:id/screenings/approve', acl(['*']), groupScreeningController.approve);

/**
 * @api {get} /groups/screenings/paginate?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Get group screenings collection
 * @apiVersion 1.0.0
 * @apiName FetchPaginated
 * @apiGroup Group Screening
 *
 * @apiDescription Get a collection of group screenings. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`.
 *
 * @apiSuccess {String} _id group screening id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} screenings Screenings of all members
 * @apiSuccess {String} status Status of the group
 *
 * @apiSuccessExample Response Example:
 *  {
        "total_pages": 1,
        "total_docs_count": 5,
        "current_page": 1,
        "docs": [
            {
                "_id": "5c778273a888400001bacb3b",
                ...
            },
            {
                ...
            }...
        ]
 *  }
 */
router.get('/screenings/paginate', acl(['*']), groupScreeningController.fetchAllByPagination);

router.get('/screenings/ongoing', acl(['*']), groupScreeningController.fetchOngoingPagination);


/**
 * @api {put} /groups/:id/screenings/create Creates new group screening
 * @apiVersion 1.0.0
 * @apiName Create
 * @apiGroup Group Screening
 *
* @apiDescription Creates new group screening. This indirectly means starting a new loan cycle for the group
 *
 * @apiExample Usage Example
 * api.test.bidir.gebeya.co/groups/5df3a2705ecb2f103063377f/screenings/create
 *
 * @apiSuccess {String} _id group screening id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} screenings Screenings of all members
 * @apiSuccess {String} status Status of the group
 * 
 * @apiSuccessExample Response Example:
 {
    "_id": "5df3a2705ecb2f1030633780",
    "last_modified": "2019-12-14T16:27:36.446Z",
    "date_created": "2019-12-13T14:38:40.800Z",
    "group": {
        "_id": "5df3a2705ecb2f103063377f",
        ...
    },
    "screenings": [
        {
            "_id": "5df4dc3e7c604a3508fb7396",
            "last_modified": "2019-12-14T16:27:36.326Z",
            "date_created": "2019-12-14T12:57:34.011Z",
            "client": {
                "_id": "5df4dc3d7c604a3508fb7376",
                ...
            },
            "created_by": "5b925494b1cfc10001d80908",
            "branch": "5b9283679fb7f20001f1494d",
            "comment": "",
            "status": "new",
            "questions": [
                {
                    "_id": "5df4dc3d7c604a3508fb7377",
                    "question_text": "Where is the farmer's permanent residence?",
                    ...
                }...
            ],
            "disclaimer": "",
            "signatures": [
                "Applicant",
                "Filled By",
                "Checked By"
            ],
            "sections": [],
            "has_sections": false,
            "layout": "THREE_COLUMNS",
            "for_group": true,
            "purpose": "Screening Application For Addis Samson",
            "subtitle": "",
            "title": "Client Screening Form"
        },
        {
            "_id": "5df4dcc57c604a3508fb73b8",
            ...
        },
        {
            "_id": "5df4dd077c604a3508fb73da",
            ...
        }
    ],
    "status": "new"     
     
 }
 * 
 * 
 * 
 * **/
router.post('/screenings/create', acl(['*']), groupScreeningController.createGroupScreening);

/********************************************************************** */

/**
 * @api {put} /groups/:id/loans/initialize Initializes group loan application
 * @apiVersion 1.0.0
 * @apiName Initialize
 * @apiGroup Group Loan Application
 *
 * @apiDescription Initializes group loan application for the group. It instantiates loan application
 *                 for each member of the group and return the group loan application object.
 * 
 * @apiSuccess {String} _id group loan application id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} loans List of loan applications of all members
 * @apiSuccess {String} status Status of the group
 * 
 * @apiSuccessExample Response Example:
    *  "_id": "5df556551753a050f48647f5",
        "last_modified": "2019-12-14T21:38:32.030Z",
        "date_created": "2019-12-14T21:38:29.752Z",
        "group": {
            "_id": "5df3a2705ecb2f103063377f",
            ...
        },
        "created_by": "5c5aadf6b711700001a016d7",
        "status": "new",
        "loans": [
            {
                "_id": "5df55656e9e33d3c1c69baa7",
                "last_modified": "2019-12-14T21:38:30.692Z",
                "date_created": "2019-12-14T21:38:30.692Z",
                "client": {
                    "_id": "5df4dc3d7c604a3508fb7376",
                    ...
                },
                "created_by": "5b925494b1cfc10001d80908",
                "branch": "5b9283679fb7f20001f1494d",
                "comment": "",
                "status": "new",
                "questions": [],
                "disclaimer": "",
                "signatures": [
                    "Filled By",
                    "Checked By"
                ],
                "sections": [
                    {
                        "_id": "5df55656e9e33d3c1c69ba83",
                        ...
                    }...
                ],
                "has_sections": true,
                "layout": "TWO_COLUMNS",
                "for_group": true,
                "purpose": "Loan Application For Addis Samson",
                "subtitle": "",
                "title": "Loan Form"
            },
            {
                "_id": "5df55657e9e33d3c1c69bada",
                ...

            },
            {
                "_id": "5df55657e9e33d3c1c69bb0d",
                ...

            }
        ]
}

**/
router.post('/:groupId/loans/initialize', groupLoanController.initializeGroupLoan);

/**
 * @api {get} /groups/:id/loans Get Group Loan Application
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Group Loan Application
 *
 * @apiDescription Get group loan application for the given group
 *
 * @apiSuccess {String} _id group loan application id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} loans List of loan applications of all members
 * @apiSuccess {String} status Status of the group
 * 
 * @apiSuccessExample Response Example:
    *  "_id": "5df556551753a050f48647f5",
        "last_modified": "2019-12-14T21:38:32.030Z",
        "date_created": "2019-12-14T21:38:29.752Z",
        "group": {
            "_id": "5df3a2705ecb2f103063377f",
            ...
        },
        "created_by": "5c5aadf6b711700001a016d7",
        "status": "new",
        "loans": [
            {
                "_id": "5df55656e9e33d3c1c69baa7",
                ...
            },
            {
                "_id": "5df55657e9e33d3c1c69bada",
                ...

            },
            {
                "_id": "5df55657e9e33d3c1c69bb0d",
                ...

            }
        ]
}
 *
 */
router.get('/:id/loans', acl(['*']), groupLoanController.fetchOne);

/**
 * @api {get} /groups/:id/loans/status Update Group Loan Application Status
 * @apiVersion 1.0.0
 * @apiName Update Status
 * @apiGroup Group Loan Application
 *
 * @apiDescription Update group loan application status for the given group. 
 *                 This endpoint inspects status of each member and changes the status of the group loan application
 *                 to an appropriate value.
 *                 The status of the group will also be changed accordingly.
 * 
 * @apiExample Usage Example
 * api.test.bidir.gebeya.co/groups/5df3a2705ecb2f103063377f/loans/status
 * 
 * @apiSuccess {String} _id group loan application id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} loans List of loan applications of all members
 * @apiSuccess {String} status Status of the group
 * 
 * @apiSuccessExample Response Example:
    *  "_id": "5df556551753a050f48647f5",
        "last_modified": "2019-12-14T21:38:32.030Z",
        "date_created": "2019-12-14T21:38:29.752Z",
        "group": {
            "_id": "5df3a2705ecb2f103063377f",
            ...
        },
        "created_by": "5c5aadf6b711700001a016d7",
        "status": "inprogress",
        "loans": [
            {
                "_id": "5df55656e9e33d3c1c69baa7",
                ...
            },
            {
                "_id": "5df55657e9e33d3c1c69bada",
                ...

            },
            {
                "_id": "5df55657e9e33d3c1c69bb0d",
                ...
            }
        ]
}
 * 
 * **/
router.put('/:id/loans/status', acl(['*']), groupLoanController.updateStatus);

/**
 * @api {put} /groups/:id/loans/submit Submit Group Loan Application
 * @apiVersion 1.0.0
 * @apiName Submit
 * @apiGroup Group Loan Application
 *
 * @apiDescription Submit a group loan application for the given group. Group loan application
 *                 will be submitted if all members loan applications are submitted. Otherwise,
 *                 appropriate status value will be assigned to the group loan application.
 *                 The status of the group will also be changed accordingly.
 * @apiExample Usage Example
 * api.test.bidir.gebeya.co/groups/5df3a2705ecb2f103063377f/loans/submit
 * 
 * @apiSuccess {String} _id group loan application id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} loans List of loan applications of all members
 * @apiSuccess {String} status Status of the group
 * 
 * @apiSuccessExample Response Example:
    *  "_id": "5df556551753a050f48647f5",
        "last_modified": "2019-12-14T21:38:32.030Z",
        "date_created": "2019-12-14T21:38:29.752Z",
        "group": {
            "_id": "5df3a2705ecb2f103063377f",
            ...
        },
        "created_by": "5c5aadf6b711700001a016d7",
        "status": "submitted",
        "loans": [
            {
                "_id": "5df55656e9e33d3c1c69baa7",
                ...
            },
            {
                "_id": "5df55657e9e33d3c1c69bada",
                ...

            },
            {
                "_id": "5df55657e9e33d3c1c69bb0d",
                ...
            }
        ]
}
 *
 */
router.put('/:id/loans/submit', acl(['*']), groupLoanController.submit);

/**
 * @api {put} /groups/:id/loans/approve Approve Group Loan Application
 * @apiVersion 1.0.0
 * @apiName Approve
 * @apiGroup Group Loan Application
 *
 * @apiDescription Approve/decline a group loan application for the given group. Group loan application
 *                 will be approved/declined based on the loan application status of each member.
 *                 Otherwise, appropriate status value will be assigned to the group loan application.
 *                 The status of the group will also be changed accordingly.
 * 
 * @apiExample Usage Example
 * api.test.bidir.gebeya.co/groups/5df3a2705ecb2f103063377f/loans/approve
 * 
 * @apiSuccess {String} _id group loan application id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} loans List of loan applications of all members
 * @apiSuccess {String} status Status of the group
 * 
 * @apiSuccessExample Response Example:
        "_id": "5df556551753a050f48647f5",
        "last_modified": "2019-12-14T21:38:32.030Z",
        "date_created": "2019-12-14T21:38:29.752Z",
        "group": {
            "_id": "5df3a2705ecb2f103063377f",
            ...
        },
        "created_by": "5c5aadf6b711700001a016d7",
        "status": "approved",
        "loans": [
            {
                "_id": "5df55656e9e33d3c1c69baa7",
                ...
            },
            {
                "_id": "5df55657e9e33d3c1c69bada",
                ...

            },
            {
                "_id": "5df55657e9e33d3c1c69bb0d",
                ...
            }
        ]
}
 *
 */
router.put('/:id/loans/approve', acl(['*']), groupLoanController.approve);


/**
 * @api {get} /groups/loans/paginate?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Get Group Loan Applications Collection
 * @apiVersion 1.0.0
 * @apiName FetchPaginated
 * @apiGroup Group Loan Application
 *
 * @apiDescription Get a collection of group loan applications. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`.
 *
 * @apiSuccess {String} _id group loan application id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} loans List of loan applications of all members
 * @apiSuccess {String} status Status of the group
 *
 * @apiSuccessExample Response Example:
 *  {
        "total_pages": 1,
        "total_docs_count": 4,
        "current_page": 1,
        "docs": [
            {
                "_id": "5c77cf257357310001e68004",
                ...
            },
            {
                ...
            }...
        ]
 *  }
 */
router.get('/loans/paginate', acl(['*']), groupLoanController.fetchAllByPagination);


router.get('/loans/ongoing', acl(['*']), groupLoanController.fetchOngoingPagination);


/**************************************************************************************/

/**
 * @api {post} /groups/acats/create Create new Group ACAT
 * @apiVersion 1.0.0
 * @apiName Create
 * @apiGroup Group ACAT Application
 *
 * @apiDescription Create a new Group ACAT Application
 *
 * @apiParam {String} group Group Id for which a group ACAT application is going to be created

 *
 * @apiParamExample Request Example:
 *  {
        "group":"5df3a2705ecb2f103063377f"
 *  }
 *
 * @apiSuccess {String} _id group ACAT application id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} acats List of ACAT applications of all members
 * @apiSuccess {String} status Status of the group
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5df5fd367e596238bc1ed0bd",
        "last_modified": "2019-12-15T09:30:30.610Z",
        "date_created": "2019-12-15T09:30:30.610Z",
        "group": {
            "_id": "5df3a2705ecb2f103063377f",
            "last_modified": "2019-12-15T09:23:34.258Z",
            "date_created": "2019-12-13T14:38:40.772Z",
            "branch": "5b9283679fb7f20001f1494d",
            "created_by": "5c5aadf6b711700001a016d7",
            "loan_cycle_number": 1,
            "status": "loan_application_accepted",
            "total_paid_amount": 0,
            "total_granted_amount": 0,
            "total_amount": 600000,
            "leader": "5df4dc3d7c604a3508fb7376",
            "members": [
                "5df4dc3d7c604a3508fb7376",
                "5df4dcc57c604a3508fb7398",
                "5df4dd077c604a3508fb73ba"
            ],
            "no_of_members": 3,
            "name": "Unity"
        },
        "created_by": "5c5aadf6b711700001a016d7",
        "status": "new",
        "acats": []
 *  }
 *
 */
router.post('/acats/create', acl(['*']), groupACATController.create);

/**
 * @api {post} /groups/acats/create Initializes an ACAT Application new Group ACAT
 * @apiVersion 1.0.0
 * @apiName Initialize
 * @apiGroup Group ACAT Application
 *
 * @apiDescription Initializes an ACAT application for a member of a group
 *
 * @apiParam {String} client Member ID
 * @apiParam {String} loan_product Loan product Id 
 * @apiParam {String[]} crop_acats Array of ACAT form IDs of crops the members wants to cultivate
 *
 * @apiParamExample Request Example:
 *  {
        "client": "5df4dc3d7c604a3508fb7376",
        "loan_product": "5df35f365f7fc03e78ca44a2",
        "crop_acats": ["5c02551002ff5a00012e815f"]
 *  }

 * @apiSuccess {String} _id Client ACAT  id
 * @apiSuccess {String} client Client Reference
 * @apiSuccess {String} branch Client Branch
 * @apiSuccess {Object} loan_product Loan Product Reference
 * @apiSuccess {Array} ACATs Crop ACATs
 * @apiSuccess {Boolean} for_group If the client ACAT Application belongs to a client in a group
 * @apiSuccess {Object} created_by User registering this
 * @apiSuccess {String} status Status of the client ACAT
 * @apiSuccess {Object} estimated Aggregated estimated values of the client ACAT application
 * @apiSuccess {Number} estimated.total_cost Estimated total cost of client ACAT application
 * @apiSuccess {Number} estimated.total_revenue Estimated total revenue of client ACAT application
 * @apiSuccess {Number} estimated.net_income Estimated net income of client ACAT application
 * @apiSuccess {object} estimated.net_cash_flow Estimated net cash flow of client ACAT application
 * @apiSuccess {Object} achieved Aggregated achieved values of the client ACAT application
 * @apiSuccess {Number} achieved.total_cost Achieved total cost of client ACAT application
 * @apiSuccess {Number} achieved.total_revenue Achieved total revenue of client ACAT application
 * @apiSuccess {Number} achieved.net_income Achieved net income of client ACAT application
 * @apiSuccess {object} achieved.net_cash_flow Achieved net cash flow of client ACAT application
 * @apiSuccess {String} comment Comment
 * 
 * * @apiSuccessExample Response Example:
 *  {
        "_id": "5df5ff2f9916f9358c398e93",
        "last_modified": "2019-12-15T09:38:56.587Z",
        "date_created": "2019-12-15T09:38:55.320Z",
        "client": {
            "_id": "5df4dc3d7c604a3508fb7376",
            ...
        },
        "branch": {
            "_id": "5b9283679fb7f20001f1494d",
            ...
        },
        "created_by": {
            "_id": "5c5aadf6b711700001a016d7
            ...
        },
        "comment": "",
        "achieved": {
            "net_cash_flow": {
                "dec": 0,
                "nov": 0,
                "oct": 0,
                ...
            },
            "net_income": 0,
            "total_revenue": 0,
            "total_cost": 0
        },
        "estimated": {
            "net_cash_flow": {
                "dec": 0,
                "nov": 0,
                "oct": 0,
                ...
            },
            "net_income": 0,
            "total_revenue": 0,
            "total_cost": 0
        },
        "filling_status": "new",
        "status": "inprogress",
        "ACATs": [
            {
                "_id": "5df5ff2f9916f9358c398e94",
                ...
            }
        ],
        "for_group": true,
        "loan_product": {
            "_id": "5df35f365f7fc03e78ca44a2",
            ...
        }
 *  }


 **/
router.post ('/:groupId/acats/members/initialize', groupACATController.initializeMemberACAT);
 
/**
 * @api {get} /groups/:id/acats Get Group ACAT Application
 * @apiVersion 1.0.0
 * @apiName Get
 * @apiGroup Group ACAT Application
 *
 * @apiDescription Get a group ACAT application for the given group
 *
 * @apiSuccess {String} _id group ACAT application id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} acats List of ACAT applications of all members
 * @apiSuccess {String} status Status of the group
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5df5fd367e596238bc1ed0bd",
        "last_modified": "2019-12-15T09:30:30.610Z",
        "date_created": "2019-12-15T09:30:30.610Z",
        "group": {
            "_id": "5df3a2705ecb2f103063377f",
            ...
        },
        "created_by": "5c5aadf6b711700001a016d7",
        "status": "new",
        "acats": [{
            "_id": "5df5ff2f9916f9358c398e93",
            ...
        }]
 *  }
 *
 */
router.get('/:id/acats', acl(['*']), groupACATController.fetchOne);


/**
 * @api {get} /groups/:id/loans/status Update Group ACAT Application Status
 * @apiVersion 1.0.0
 * @apiName Update Status
 * @apiGroup Group ACAT Application
 *
 * @apiDescription Update group ACAT application status for the given group. 
 *                 This endpoint inspects status of each member and changes the status of the group ACAT application
 *                 to an appropriate value.
 *                 The status of the group will also be changed accordingly.
 * 
 * @apiSuccess {String} _id group ACAT application id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} acats List of ACAT applications of all members
 * @apiSuccess {String} status Status of the group
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5df5fd367e596238bc1ed0bd",
        "last_modified": "2019-12-15T09:30:30.610Z",
        "date_created": "2019-12-15T09:30:30.610Z",
        "group": {
            "_id": "5df3a2705ecb2f103063377f",
            ...
        },
        "created_by": "5c5aadf6b711700001a016d7",
        "status": "ACAT_IN_PROGRESS",
        "acats": [{
            "_id": "5df5ff2f9916f9358c398e93",
            ...
        }]
 *  }
 * 
 * 
 **/
router.put('/:id/acats/status', acl(['*']), groupACATController.updateStatus);


/**
 * @api {put} /groups/:id/acats/submit Submit Group ACAT Application
 * @apiVersion 1.0.0
 * @apiName Submit
 * @apiGroup Group ACAT Application
 *
 * @apiDescription Submit a group ACAT application for the given group. The entire group ACAT application
 *                 will be submitted if all members ACAT applications are submitted. Otherwise,
 *                 appropriate status value will be assigned to the group ACAT application.
 *                 The status of the group will also be changed accordingly.
 * 
 * 
 * @apiSuccess {String} _id group ACAT application id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} acats List of ACAT applications of all members
 * @apiSuccess {String} status Status of the group
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5df5fd367e596238bc1ed0bd",
        "last_modified": "2019-12-15T09:30:30.610Z",
        "date_created": "2019-12-15T09:30:30.610Z",
        "group": {
            "_id": "5df3a2705ecb2f103063377f",
            ...
        },
        "created_by": "5c5aadf6b711700001a016d7",
        "status": "submitted",
        "acats": [{
            "_id": "5df5ff2f9916f9358c398e93",
            ...
        }]
 *  }
 *
 */
router.put('/:id/acats/submit', acl(['*']), groupACATController.submit);



/**
 * @api {put} /groups/:id/acats/approve Approve Group ACAT Application
 * @apiVersion 1.0.0
 * @apiName Approve
 * @apiGroup Group ACAT Application
 *
 * @apiDescription Approve/decline a group ACAT application for the given group. Group ACAT application
 *                 will be approved/declined based on the ACAT application status of each member.
 *                 Otherwise, appropriate status value will be assigned to the group ACAT application.
 *                 The status of the group will also be changed accordingly.
 * 
 * 
 * @apiSuccess {String} _id group ACAT application id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} acats List of ACAT applications of all members
 * @apiSuccess {String} status Status of the group
 *
 * @apiSuccessExample Response Example:
 *  {
        "_id": "5df5fd367e596238bc1ed0bd",
        "last_modified": "2019-12-15T09:30:30.610Z",
        "date_created": "2019-12-15T09:30:30.610Z",
        "group": {
            "_id": "5df3a2705ecb2f103063377f",
            ...
        },
        "created_by": "5c5aadf6b711700001a016d7",
        "status": "declined_final",
        "acats": [{
            "_id": "5df5ff2f9916f9358c398e93",
            ...
        }]
 *  }
 *
 */
router.put('/:id/acats/approve', acl(['*']), groupACATController.approve);

/**
 * @api {get} /groups/acats/paginate?page=<RESULTS_PAGE>&per_page=<RESULTS_PER_PAGE> Get groups collection
 * @apiVersion 1.0.0
 * @apiName FetchPaginated
 * @apiGroup Group ACAT Application
 *
 * @apiDescription Get a collection of groups. The endpoint has pagination
 * out of the box. Use these params to query with pagination: `page=<RESULTS_PAGE`
 * and `per_page=<RESULTS_PER_PAGE>`.
 *
 * @apiSuccess {String} _id group ACAT application id
 * @apiSuccess {Object} group Group detail
 * @apiSuccess {Object[]} acats List of ACAT applications of all members
 * @apiSuccess {String} status Status of the group
 *
 * @apiSuccessExample Response Example:
 *  {
        "total_pages": 1,
        "total_docs_count": 1,
        "current_page": 1,
        "docs": [
            {
                "_id": "5df5fd367e596238bc1ed0bd",
                ...
            },
            {
                ...
            }...
        ]
 *  }
 */
router.get('/acats/paginate', acl(['*']), groupACATController.fetchAllByPagination);


router.get('/acats/ongoing', acl(['*']), groupACATController.fetchOngoingPagination);



//Obsolete endpoints
router.post('/:id/loans/create', acl(['*']), groupLoanController.createForClient);
router.put('/:groupId/loans/:id', acl(['*']), groupLoanController.update);
router.put('/:groupId/acats/:id', acl(['*']), groupACATController.update);
////////////////router.post('/loans/create', acl(['*']), groupLoanController.create);

// Expose Group Router
module.exports = router;
