import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getRiskAssessmentQuestionaire from '@salesforce/apex/RiskAssessmentFlowController.getRiskAssessmentQuestionaire';
import getRiskAssessmentCategory from '@salesforce/apex/RiskAssessmentFlowController.getRiskAssessmentCategory';

export default class RiskAssessmentFlow extends LightningElement {
    @wire(getRiskAssessmentQuestionaire) sections;    
    @wire(getRiskAssessmentCategory, {score: '$scoreFinal'} ) riskCategory;
    
    mostrarCalcularCategoriaRisco = false;
    respostas = new Map();
    score = new Map();
    scoreFinal = 0;
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
        if (this.sections.data[this.sectionHandler] != null) {
            sectionClassName += this.sections.data[this.sectionHandler].sectionHTMLId;
        } else {
            sectionClassName = "";
        }
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
        if (this.sections.data[this.sectionHandler] != null) {
            questionClassName += this.sections.data[this.sectionHandler].questions[this.questionHandler].questionHTMLId;
            if (this.questionHandler + 1 == this.sections.data[this.sectionHandler].questions.length) {
                this.questionHandler = -1;
            }
        } else {
            questionClassName = "";
        }

        return questionClassName;
    }

    handleChange(evt) {
        var selectedResponse;
        if (evt.target.type == 'button') {
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

        var encontrouElemento = false;
        for (let i = 0; i < this.sections.data.length; i++) {
            for (let j = 0; j < this.sections.data[i].questions.length; j++) {
                if (evt.target.id.indexOf(this.sections.data[i].questions[j].questionHTMLId) != -1) {

                    if (evt.target.type == 'button') {
                        var finalScore = parseFloat(evt.target.value) * this.sections.data[i].questions[j].weight;
                        this.score.set(evt.target.label, finalScore);
                    }
                    
                    encontrouElemento = true;
                    break;
                }
            }
            if (encontrouElemento) {
                break;
            }
        }
    }

    handleFocus(evt) {
        var encontrouElemento = false;
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

                    if (!this.mostrarCalcularCategoriaRisco) {
                        this.mostrarCalcularCategoriaRisco = this.sections.data[i].questions[j].isLast;
                    }
                    encontrouElemento = true;
                    break;
                }
            }
            if (encontrouElemento) {
                break;
            }
        }
    }

    handleClickCalcular(evt) {

        var inputList = this.template.querySelectorAll(".slds-form-element");
        var validForm = true;
        inputList.forEach(element => {
            validForm = validForm & element.validity.valid;
        }); 

        if (!validForm) {
            const evt = new ShowToastEvent({
                title: 'Erro',
                message: 'Corrija o formuário e tente novamente.',
                variant: 'error',
                mode: 'dismissable'
            });
            this.dispatchEvent(evt);
        } else {
            var className = this.template.querySelector('.BSC_page1').className;
            if (className.indexOf('slds-is-expanded') != -1) {
                className = className.substring(0, className.indexOf('slds-is-expanded')) + 'slds-is-collapsed';
                this.template.querySelector('.BSC_page1').className = className;
            }
    
            for (let [k, v] of this.score) {
                this.scoreFinal += v;
            }
    
            console.log('Score final: ' + this.scoreFinal);
            console.log(this.riskCategory.data);
    
            className = this.template.querySelector('.BSC_page2').className;
            if (className.indexOf('slds-is-collapsed') != -1) {
                className = className.substring(0, className.indexOf('slds-is-collapsed')) + 'slds-is-expanded';
                this.template.querySelector('.BSC_page2').className = className;
            }
        }
        
    }
}
