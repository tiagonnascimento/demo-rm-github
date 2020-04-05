public with sharing class RiskAssessmentFlowController {
    @AuraEnabled(cacheable=true)
    public static List<Question__c> getQuestionList() {
        return [
            SELECT Risk_Assessment_Section__r.Name, Name, Question_Text__c, Question_Type__c, Sequence__c, Weight__c 
            FROM Question__c 
            WHERE Risk_Assessment_Section__r.Risk_Assessment_Definition__r.Active__c = true 
            ORDER BY Risk_Assessment_Section__r.Sequence__c, Sequence__c
        ];
    }
}
