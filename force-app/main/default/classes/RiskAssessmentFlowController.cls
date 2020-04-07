public with sharing class RiskAssessmentFlowController {

    public static String HTML_ID_PREFIX = 'BS-COVID-19-';

    @AuraEnabled(cacheable=true)
    public static List<Section> getRiskAssessmentQuestionaire() {

        List<Section> sectionList = new List<Section>();

        BSC_Risk_Assessment_Definition__c rad = 
            [SELECT Id
            FROM BSC_Risk_Assessment_Definition__c WHERE Active__c = TRUE 
            ORDER BY Initial_Date__c DESC  
            LIMIT 1];

        List<BSC_Risk_Assessment_Section__c> sectionsc = 
            [SELECT Id, Name From BSC_Risk_Assessment_Section__c 
            WHERE Risk_Assessment_Definition__c = :rad.Id 
            ORDER BY Sequence__c];
        
        Integer sectionNumber = 0;
        Integer questionNumber = 0;

        for (BSC_Risk_Assessment_Section__c sectionc : sectionsc) {
            Section sec = new Section();
            sec.Id = sectionc.Id;
            sec.text = sectionc.Name;
            sec.sectionHTMLId = HTML_ID_PREFIX + 'S-' + sectionNumber;
            sec.questions = new List<Question>();

            List<BSC_Question__c> questionsc = 
                [SELECT Id, Question_Text__c, Question_Type__c, Weight__c, Is_Required__c, Is_Last_Question__c,
                    (Select Id, Option_Value__c, Option_Score__c FROM Question_Options__r ORDER BY Option_Score__c) 
                FROM BSC_Question__c 
                WHERE Risk_Assessment_Section__c = :sectionc.Id
                ORDER BY Sequence__c];

            for (BSC_Question__c questionc : questionsc) {
                Question qst = new Question();
                qst.id = questionc.Id;
                qst.text = questionc.Question_Text__c;
                qst.setType(questionc.Question_Type__c);
                qst.weight = questionc.Weight__c;
                qst.isRequired = questionc.Is_Required__c;
                qst.isLast = questionc.Is_Last_Question__c;
                qst.questionHTMLId = sec.sectionHTMLId + '-Q-' + questionNumber;
                questionNumber += 1;

                if (sectionNumber + 1 < sectionsc.size()) {
                    qst.nextSectionHTMLId = HTML_ID_PREFIX + 'S-' + (sectionNumber + 1);
                }

                if (questionNumber < questionsc.size()) {
                    qst.nextQuestionHTMLId = sec.sectionHTMLId + '-Q-' + questionNumber;
                } else {
                    qst.nextQuestionHTMLId = qst.nextSectionHTMLId + '-Q-0';
                }

                qst.options = new List<Option>();
                if (questionc.Question_Options__r != null && questionc.Question_Options__r.size() > 0) {
                    for (BSC_Question_Option__c optionc : questionc.Question_Options__r) {
                        Option opt = new Option();
                        opt.label = optionc.Option_Value__c;
                        opt.value = String.valueOf(optionc.Option_Score__c);
                        qst.options.add(opt);
                    }
                }
                sec.questions.add(qst);
            }
            sectionNumber += 1;
            questionNumber = 0;
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
        @AuraEnabled public Boolean isRequired;
        @AuraEnabled public List<Option> options;
        @AuraEnabled public Boolean isText;
        @AuraEnabled public Boolean isNumber;
        @AuraEnabled public Boolean isList;
        @AuraEnabled public Boolean isLast;
        @AuraEnabled public String questionHTMLId;
        @AuraEnabled public String nextQuestionHTMLId;
        @AuraEnabled public String nextSectionHTMLId;

    

        public void setType(String type) {
            this.type = type;
            this.isText = 'Text'.equals(type);
            this.isNumber = 'Number'.equals(type);
            this.isList = 'List'.equals(type);
        }
    }
    
    public class Section {
        @AuraEnabled public Id id;
        @AuraEnabled public String text;
        @AuraEnabled public String sectionHTMLId;
        @AuraEnabled public List<Question> questions;
    }
    
    public class Category {
        @AuraEnabled public double minimumScore;
        @AuraEnabled public String textToDisplay;
    }
    
}
