import { LightningElement, wire } from 'lwc';
import getRiskAssessmentQuestionaire from '@salesforce/apex/RiskAssessmentFlowController.getRiskAssessmentQuestionaire';

export default class RiskAssessmentFlow extends LightningElement {
    @wire(getRiskAssessmentQuestionaire) sections;

    respostas = new Map();
    score = new Map();

    handleChange(evt) {
        var selectedResponse;
        if (evt.target.type == 'button') {
            this.score.set(evt.target.label, evt.target.value);
            for (let i = 0; i < evt.target.options.length; i++) {
                if (evt.target.options[i].value == evt.target.value) {
                    selectedResponse = evt.target.options[i].label;
                    break;
                }
            }
        } else {
            selectedResponse = evt.target.value; 
        }

        this.respostas.set(evt.target.label, selectedResponse);
    }
}
