module.exports = {
    QUESTION: {
        TYPES: ['YES_NO', 'FILL_IN_BLANK', 'MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'GROUPED'],
        VALIDATION: ['NONE', 'ALPHANUMERIC', 'NUMERIC', 'ALPHABETIC']
    },
    FORM: {
        LAYOUTS: ['TWO_COLUMNS', 'THREE_COLUMNS'],
        TYPES: ['SCREENING', 'LOAN_APPLICATION', 'GROUP_APPLICATION', 'ACAT'],
        SIGNATURES: {
          LOAN: ['Filled By', 'Checked By'],
          SCREENING: ['Applicant', 'Filled By', 'Checked By']
        }
    },
    MODULES: ['MFI_SETUP','USER_MANAGEMENT']
}