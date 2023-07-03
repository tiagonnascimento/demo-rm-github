public with sharing class ReferenciaCampoTeste {
    
    private void testeReferenciaCampo() {

        List<PricebookEntry> pbes = [SELECT Id, CAMPO_FORMULA__c from PricebookEntry];
        for (PricebookEntry pbe : pbes) {
            System.debug('PBE FORMULA: ' + pbe.CAMPO_FORMULA__c);
        }
        
    }
    
}