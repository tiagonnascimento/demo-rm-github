import { LightningElement, wire } from 'lwc';
import getRiskAssessmentQuestionaire from '@salesforce/apex/RiskAssessmentFlowController.getRiskAssessmentQuestionaire';

export default class RiskAssessmentFlow extends LightningElement {
    @wire(getRiskAssessmentQuestionaire) sections;

    respostas = new Map();
    score = new Map();
    sectionHandler = -1;
    questionHandler = -1;

    get sectionClass() {
        this.sectionHandler += 1;
        var sectionClassName;
        if (this.sectionHandler == 0) {
            sectionClassName = "slds-is-expanded ";
        } else {
            sectionClassName = "slds-is-collapsed ";
        }
        sectionClassName += this.sections.data[this.sectionHandler].sectionHTMLId;
        return sectionClassName;
    }

    get questionClass() {
        this.questionHandler += 1;
        var questionClassName
        if (this.questionHandler == 0) {
            questionClassName = "slds-is-expanded ";
        } else {
            questionClassName = "slds-is-collapsed ";
        }
        questionClassName += this.sections.data[this.sectionHandler].questions[this.questionHandler].questionHTMLId;

        if (this.questionHandler + 1 == this.sections.data[this.sectionHandler].questions.length) {
            this.questionHandler = -1;
        }

        return questionClassName;
    }

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

        for (let i = 0; i < this.sections.data.length; i++) {
            for (let j = 0; j < this.sections.data[i].questions.length; j++) {
                if (evt.target.id.indexOf(this.sections.data[i].questions[j].questionHTMLId) != -1) {
                    var nextQuestionElement = this.template.querySelector('.'+this.sections.data[i].questions[j].nextQuestionHTMLId);
                    if (nextQuestionElement != null && nextQuestionElement.className.indexOf('slds-is-expanded') == -1) {
                        nextQuestionElement.className = 'slds-is-expanded';
                    }

                    if (j+1 == this.sections.data[i].questions.length) {
                        var nextSectionElement = this.template.querySelector('.'+this.sections.data[i].questions[j].nextSectionHTMLId);
                        if (nextSectionElement != null && nextSectionElement.className.indexOf('slds-is-expanded') == -1) {
                            nextSectionElement.className = 'slds-is-expanded';
                        }
                    }
                    break;
                }
            }
        }
    }
}
