import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';
import getRiskAssessmentQuestionaire from '@salesforce/apex/RiskAssessmentFlowController.getRiskAssessmentQuestionaire';
import getRiskAssessmentCategory from '@salesforce/apex/RiskAssessmentFlowController.getRiskAssessmentCategory';

export default class RiskAssessmentFlow extends NavigationMixin(LightningElement) {
    @wire(getRiskAssessmentQuestionaire) sections;    
    @wire(getRiskAssessmentCategory, {score: '$scoreFinal'} ) riskCategory;
    
    mostrarCalcularCategoriaRisco = false;
    respostas = new Map();
    score = new Map();
    scoreFinal = 0;
    sectionHandler = -1;
    questionHandler = -1;
    hasRendered = false;

    message;
    error;

    renderedCallback() {
        if (!this.hasRendered) {
            this.hasRendered = true;
        } 
    }

    get sectionClass() {
        var sectionClassName;
        if (this.hasRendered) {
            this.sectionHandler += 1;
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
        } else {
            sectionClassName = "";
        }
        
        return sectionClassName;
    }

    get questionClass() {
        var questionClassName

        if (this.hasRendered) {
            this.questionHandler += 1;
            if (this.questionHandler == 0) {
                questionClassName = "slds-is-expanded ";
            } else {
                questionClassName = "slds-is-collapsed ";
            }
            if (this.sections.data[this.sectionHandler] != null &&
                this.sections.data[this.sectionHandler].questions[this.questionHandler] != null) {
                questionClassName += this.sections.data[this.sectionHandler].questions[this.questionHandler].questionHTMLId;
                if (this.questionHandler + 1 == this.sections.data[this.sectionHandler].questions.length) {
                    this.questionHandler = -1;
                }
            } else {
                questionClassName = "";
            }
        } else {
            questionClassName = "";
        }
        
        return questionClassName;
    }

    get hideSpinner() {
        if (this.template.querySelector('.spinner-show') != null) {
            this.template.querySelector('.spinner-show').className = 'spinner-hide';
        }
        return '';
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
            if (this.template.querySelector('.spinner-hide') != null) {
                this.template.querySelector('.spinner-hide').className = 'spinner-show';
            }
            var className = this.template.querySelector('.BSC_page1').className;
            if (className.indexOf('slds-is-expanded') != -1) {
                className = className.substring(0, className.indexOf('slds-is-expanded')) + 'slds-is-collapsed';
                this.template.querySelector('.BSC_page1').className = className;
            }
    
            for (let [k, v] of this.score) {
                this.scoreFinal += v;
            }
    
            className = this.template.querySelector('.BSC_page2').className;
            if (className.indexOf('slds-is-collapsed') != -1) {
                className = className.substring(0, className.indexOf('slds-is-collapsed')) + 'slds-is-expanded';
                this.template.querySelector('.BSC_page2').className = className;
            }

            var windowTop = parseInt(this.template.querySelector('.BSC_page2').offsetTop) - 80;

            var scrollOptions = {
                left: 0,
                top: windowTop,
                behavior: 'smooth'
            }
            window.scrollTo(scrollOptions);
        }
    }

    handleClickAbrirChamado(evt) {

        var description = '';
        this.respostas.forEach(function(value, key) {
            description += key + ': ' + value + '\n'
        });

        const defaultValues = encodeDefaultFieldValues({
            Status: 'New',
            Origin: 'Web-COVID',
            Subject: 'Formulário de Análise de Risco de COVID-19: ' + this.riskCategory.data.name,
            Priority: this.riskCategory.data.casePriority,
            Description: description
        });

        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Case',
                actionName: 'new'
            },
            state: {
                defaultFieldValues: defaultValues,
                recordTypeId: this.riskCategory.data.caseRecordTypeId
            }
        });

    }
}
