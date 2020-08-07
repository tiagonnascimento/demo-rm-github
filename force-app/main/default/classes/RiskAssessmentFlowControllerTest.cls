@isTest()
public with sharing class RiskAssessmentFlowControllerTest {
    @TestSetup
    static void makeData() {
        BSC_Risk_Assessment_Definition__c def = new BSC_Risk_Assessment_Definition__c(
            Name = 'TestForm',     
            Active__c = true,
            Initial_Date__c = Date.Today());
        
        insert def;

        BSC_Risk_Assessment_Section__c section = new BSC_Risk_Assessment_Section__c(
            Risk_Assessment_Definition__c = def.Id,
            DisplayText__c = 'Sintomas',
            Name = 'Sintomas',
            Sequence__c = 10
        );
        insert section;

        BSC_Question__c question = new BSC_Question__c(
            Name = 'Febre (acima de 37,8)?',
            Question_Text__c = 'Está com febre (acima de 37,8˚)?',
            Question_Type__c = 'List',
            Sequence__c = 10,
            Weight__c = 1,
            Is_Required__c = true,
            Risk_Assessment_Section__c = section.Id
        );
        insert question;

        BSC_Question_Option__c option = new BSC_Question_Option__c(
            Name = 'Sim',
            Option_Score__c = 10,
            Option_Value__c = 'Sim', 
            Question__c = question.Id
        );
        insert option;

        option = new BSC_Question_Option__c(
            Name = 'Não',
            Option_Score__c = 0,
            Option_Value__c = 'Não', 
            Question__c = question.Id
        );
        insert option;

        BSC_Risk_Category__c category = new BSC_Risk_Category__c(
            Case_Record_Type__c = 'Base',
            Final_Message_To_Display__c = 'Mantenha-se em isolamento relativo em casa, meça temperature 4 x ao dia e repita a auto-avaliação de 2 em 2 dias.',
            Minimum_Score__c = 10,
            Name = 'Paciente de Médio Risco',
            Risk_Assessment_Definition__c = def.Id,
            Create_a_Case__c = true, 
            Case_Priority__c = 'Medium'
        );
        insert category;

    }

    @IsTest
    static void testGetRiskAssessmentQuestionaire(){
        Test.startTest();
        List<RiskAssessmentFlowController.Section> secoes = RiskAssessmentFlowController.getRiskAssessmentQuestionaire('TestForm');
        System.assertEquals(secoes.size(), 1);
        System.assertEquals(secoes.get(0).questions.get(0).options.size(), 2);
        Test.stopTest();
    }

    @IsTest
    static void testGetRiskAssessmentCategory() {
        Test.startTest();
        RiskAssessmentFlowController.Category cat = RiskAssessmentFlowController.getRiskAssessmentCategory('TestForm', 10, null);
        System.assert(cat.createACase);
        cat = RiskAssessmentFlowController.getRiskAssessmentCategory('TestForm', 9, null);
        System.assertEquals(cat, null);
        Test.stopTest();
    }

    @IsTest
    static void testCreateOrUpdateCase() {
        Test.startTest();
        RiskAssessmentFlowController.Category cat = RiskAssessmentFlowController.getRiskAssessmentCategory('TestForm', 10, null);
        
        RiskAssessmentFlowController.CreateCaseRequest request = new RiskAssessmentFlowController.CreateCaseRequest();
        request.riskCategoryId = cat.categoryId;
        request.respostas = 'Respostas';
        request.nomeContato = 'Teste';
        request.email = 'teste@teste.com';
        request.phone = '11-99111-9911';
        
        String idCaso = RiskAssessmentFlowController.createUpdateCase(request);
        System.assertNotEquals(idCaso, null);
        Case caso = [SELECT Id FROM Case WHERE Id = :idCaso];
        System.assert(caso != null);
        Test.stopTest();
    }

}