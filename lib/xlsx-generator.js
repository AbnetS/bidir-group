'use strict';
/**
 * Load Module Dependencies.
 */
const util       = require ('util');
const XlsxTemplate = require('xlsx-template');
const fs           = require ('fs-extra')
class XLSX_GENERATOR {
    constructor(){
    }
    async generateXlsx(data, template){
        let func =  util.promisify(this._generateXlsx);
      
          let result;
          try {
            result = await func(data, template);      
            return result;
          } catch (ex) {
            throw(ex);
          } 
        
        
      }
      
      _generateXlsx(data,template, cb){
            fs.readFile(template, function(err, templateData) {
                if (err) {
                    cb(err);
                }
                // Create a template
                let template = new XlsxTemplate(templateData);
        
                // Replacements take place on first sheet
                let sheetNumber = 1;
        
                
                // Perform substitution
                template.substitute(sheetNumber, data);
        
                // Get binary data
                let response = template.generate({type: 'nodebuffer'});
        
                cb(null,response)
        })
    }
}
module.exports = XLSX_GENERATOR;