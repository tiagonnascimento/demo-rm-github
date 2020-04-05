import { LightningElement, wire } from 'lwc';
import getQuestionList from '@salesforce/apex/RiskAssessmentFlowController.getQuestionList';

export default class RiskAssessmentFlow extends LightningElement {
    @wire(getQuestionList) questions;
}
