import { LightningElement, wire } from 'lwc';
import getRiskAssessmentQuestionaire from '@salesforce/apex/RiskAssessmentFlowController.getRiskAssessmentQuestionaire';

export default class RiskAssessmentFlow extends LightningElement {
    @wire(getRiskAssessmentQuestionaire) sections;
}
