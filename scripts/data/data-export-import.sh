#!/bin/sh
#echo "Exporting Risk_Assessment_Definition__c from $1" 
#sfdx force:data:tree:export --query \
#    "SELECT Active__c,End_Date__c,Id,Initial_Date__c,Name FROM Risk_Assessment_Definition__c" \
#    --prefix export-data --outputdir scripts/data --plan -u $1

#echo "Exporting Risk_Assessment_Section__c from $1"
#sfdx force:data:tree:export --query \
#    "SELECT DisplayText__c,Id,Name,Risk_Assessment_Definition__c,Sequence__c FROM Risk_Assessment_Section__c" \
#    --prefix export-data --outputdir scripts/data --plan  -u $1

#echo "Exporting Risk_Category__c from $1"
#sfdx force:data:tree:export --query \
#    "SELECT Case_Record_Type__c,Case_Stage__c,Final_Message_To_Display__c,Minimum_Score__c,Name,Risk_Assessment_Definition__c \
#     FROM Risk_Category__c" \
#    --prefix export-data --outputdir scripts/data --plan  -u $1

#echo "Exporting Question__c from $1"
#sfdx force:data:tree:export --query \
#    "SELECT Id,Name,Question_Text__c,Question_Type__c,Risk_Assessment_Section__c,Sequence__c,Weight__c \
#     FROM Question__c" \
#    --prefix export-data --outputdir scripts/data --plan  -u $1

#echo "Exporting Question_Option__c from $1"
#sfdx force:data:tree:export --query \
#    "SELECT Finish_Section__c,Following_Question__c,Id,Name,Option_Score__c,Option_Value__c,Question__c \
#    FROM Question_Option__c" \
#    --prefix export-data --outputdir scripts/data --plan  -u $1
    
echo "Importing data to $2"
sfdx force:data:tree:import -u $2 \
    --plan scripts/data/data-import-plan.json