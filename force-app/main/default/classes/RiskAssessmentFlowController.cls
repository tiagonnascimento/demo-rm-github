public with sharing class RiskAssessmentFlowController {

    @AuraEnabled(cacheable=true)
    public static List<Section> getRiskAssessmentQuestionaire() {

        List<Section> sectionList = new List<Section>();

        Risk_Assessment_Definition__c rad = 
            [SELECT Id
            FROM Risk_Assessment_Definition__c WHERE Active__c = TRUE 
            ORDER BY Initial_Date__c DESC  
            LIMIT 1];

        List<Risk_Assessment_Section__c> sectionsc = 
            [SELECT Id, Name From Risk_Assessment_Section__c 
            WHERE Risk_Assessment_Definition__c = :rad.Id 
            ORDER BY Sequence__c];

        for (Risk_Assessment_Section__c sectionc : sectionsc) {
            Section sec = new Section();
            sec.Id = sectionc.Id;
            sec.text = sectionc.Name;
            sec.questions = new List<Question>();

            List<Question__c> questionsc = 
                [SELECT Id, Question_Text__c, Question_Type__c, Weight__c, 
                    (Select Id, Option_Value__c, Option_Score__c FROM Question_Options__r) 
                FROM Question__c 
                WHERE Risk_Assessment_Section__c = :sectionc.Id
                ORDER BY Sequence__c];

            for (Question__c questionc : questionsc) {
                Question qst = new Question();
                qst.id = questionc.Id;
                qst.text = questionc.Question_Text__c;
                qst.setType(questionc.Question_Type__c);
                qst.weight = questionc.Weight__c;
                qst.options = new List<Option>();
                if (questionc.Question_Options__r != null && questionc.Question_Options__r.size() > 0) {
                    for (Question_Option__c optionc : questionc.Question_Options__r) {
                        Option opt = new Option();
                        opt.label = optionc.Option_Value__c;
                        opt.value = String.valueOf(optionc.Option_Score__c);
                        qst.options.add(opt);
                    }
                }
                sec.questions.add(qst);
            }
            sectionList.add(sec);
        }

        System.debug('Quantity of sections found: ' + sectionList.size());
        for (Section sec : sectionList) {
            System.debug('Section: ' + JSON.serializePretty(sec));
        }

        return sectionList;
    }

    public class Option {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
    }

    public class Question {
        @AuraEnabled public Id id; 
        @AuraEnabled public String text;
        @AuraEnabled public String type;
        @AuraEnabled public Double weight;
        @AuraEnabled public List<Option> options;
        @AuraEnabled public Boolean isText;
        @AuraEnabled public Boolean isNumber;
        @AuraEnabled public Boolean isYesNo;
        @AuraEnabled public Boolean isList;
    

        public void setType(String type) {
            this.type = type;
            this.isText = 'Text'.equals(type);
            this.isNumber = 'Number'.equals(type);
            this.isYesNo = 'Yes/No'.equals(type);
            this.isList = 'List'.equals(type);
        }
    }
    
    public class Section {
        @AuraEnabled public Id id;
        @AuraEnabled public String text;
        @AuraEnabled public List<Question> questions;
    }
    
    public class Category {
        @AuraEnabled public double minimumScore;
        @AuraEnabled public String textToDisplay;
    }
    
}
