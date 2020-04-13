public with sharing class RiskAssessmentFlowController {

    public static String HTML_ID_PREFIX = 'BS-COVID-19-';

    @AuraEnabled
    public static String createUpdateCase(CreateCaseRequest request) {

        BSC_Risk_Category__c categoria = 
            [SELECT Id, Name, Case_Record_Type__c, Case_Priority__c, Create_a_Case__c
            FROM BSC_Risk_Category__c
            WHERE Id = :request.riskCategoryId];

        Id objectId = null;

        if (categoria.Create_a_Case__c) {

            Account acct = null;
            try {
                acct = [Select Id, Name, Phone, PersonEmail from Account WHERE Phone = :request.phone];
            } catch (QueryException ex) {
                // não faz nada, contato não existe
            }
            
            if (acct == null) {
                acct = new Account();
            }

            acct.Name = request.nomeContato;
            acct.Phone = request.phone;
            acct.PersonEmail = request.email;

            if (acct.Id != null) {
                update acct;
            } else {
                insert acct; 
            }
            
            Case caso = new Case();
            caso.Status = 'New';
            caso.Origin = 'Web-COVID19';
            caso.Subject = 'Formulário de Análise de Risco de COVID-19 - Paciente:  ' 
                            + request.nomeContato + ' Categoria de Risco: ' + categoria.Name;
            caso.Priority = categoria.Case_Priority__c;
            caso.Description = request.respostas;
            caso.AccountId = acct.Id;

            // TODO: Remover comentários abaixo.
            // O trecho abaixo está comentado porque não é possível criar um Unlocked Package com ele, já que 
            // o processo de validação de metadados falha, não reconhecendo o Case.RecordTypeId como uma variável 
            // válida. Isto fará com que o caso criado seja o padrão da plataforma, e não o especificado na categoria
            // de risco. Como este código faz parte de um unlocked package, basta descomentar as linhas abaixo e
            // o componente voltará a funcionar como esperado. Acredito que tenha a ver com o Known Issue abaixo:
            // https://success.salesforce.com/issues_view?id=a1p3A000000ATmUQAW&title=error-deploying-compact-layouts-in-field-recordtypeid-no-customfield-named-account-recordtypeid-found
            // Pode ter certeza que eu tentei - acredito que gastei mais de 2 horas neste ponto e não saí do lugar. 

            // if (categoria.Case_Record_Type__c != null 
            //     && Schema.SObjectType.Case.getRecordTypeInfosByName().get(categoria.Case_Record_Type__c) != null) {

            //         caso.RecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get(categoria.Case_Record_Type__c).getRecordTypeId();
            // }

            insert caso;

            objectId = caso.Id;
        }

        return objectId;
    }

    @AuraEnabled(cacheable=true) 
    public static Category getRiskAssessmentCategory(Double score, Id idRegistro) {

        Category catR = null;

        BSC_Risk_Assessment_Definition__c rad = 
            [SELECT Id
            FROM BSC_Risk_Assessment_Definition__c WHERE Active__c = TRUE 
            ORDER BY Initial_Date__c DESC  
            LIMIT 1];

        List<BSC_Risk_Category__c> categories = 
            [SELECT Id, Name, Final_Message_To_Display__c, Create_a_Case__c, Case_Record_Type__c, Minimum_Score__c, Case_Priority__c
            FROM BSC_Risk_Category__c
            WHERE Risk_Assessment_Definition__c = :rad.Id
            ORDER BY Minimum_Score__c DESC];

        
        Account acct = null;
        if (idRegistro != null && 'Account'.equals(idRegistro.getSObjectType().getDescribe().getName())) {
            acct = [SELECT Name, PersonEmail, Phone FROM Account WHERE Id = :idRegistro];
        }
        
        for (BSC_Risk_Category__c cat : categories) {
            if (catR == null && cat.Minimum_Score__c <= score) {
                catR = new Category();
                catR.categoryId = cat.Id;
                catR.name = cat.Name;
                if (Schema.SObjectType.Case.getRecordTypeInfosByName().get(cat.Case_Record_Type__c) != null) {
                    catR.caseRecordTypeId = Schema.SObjectType.Case.getRecordTypeInfosByName().get(cat.Case_Record_Type__c).getRecordTypeId();
                }
                catR.casePriority = cat.Case_Priority__c;
                catR.createACase = cat.Create_a_Case__c;
                catR.textToDisplay = cat.Final_Message_To_Display__c;
                if (acct != null) {
                    catR.nomeContato = acct.Name;
                    catR.phone = acct.Phone;
                    catR.email = acct.PersonEmail;
                }
                break;
            }
        }
        return catR;

    }

    @AuraEnabled(cacheable=true)
    public static List<Section> getRiskAssessmentQuestionaire(String defName) {

        List<Section> sectionList = new List<Section>();

        BSC_Risk_Assessment_Definition__c rad = 
            [SELECT Id
            FROM BSC_Risk_Assessment_Definition__c 
            WHERE Name = :defName AND Active__c = TRUE 
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
        @AuraEnabled public Id categoryId;
        @AuraEnabled public String name;
        @AuraEnabled public boolean createACase;
        @AuraEnabled public Id caseRecordTypeId; 
        @AuraEnabled public String casePriority;
        @AuraEnabled public String textToDisplay;
        @AuraEnabled public String nomeContato; 
        @AuraEnabled public String email;
        @AuraEnabled public String phone;
    }
    
    public class CreateCaseRequest {
        @AuraEnabled public Id riskCategoryId {get; set;}
        @AuraEnabled public String respostas{get; set;}
        @AuraEnabled public String nomeContato {get; set;}
        @AuraEnabled public String email {get; set;}
        @AuraEnabled public String phone {get; set;}
    }
}
