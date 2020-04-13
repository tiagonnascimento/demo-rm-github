import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import createUpdateCase from '@salesforce/apex/RiskAssessmentFlowController.createUpdateCase';
import getRiskAssessmentQuestionaire from '@salesforce/apex/RiskAssessmentFlowController.getRiskAssessmentQuestionaire';
import getRiskAssessmentCategory from '@salesforce/apex/RiskAssessmentFlowController.getRiskAssessmentCategory';

export default class RiskAssessmentFlow extends NavigationMixin(LightningElement) {
    @wire(getRiskAssessmentQuestionaire, {defName: '$riskAssessmentDefinitionName'}) sections;    
    @wire(getRiskAssessmentCategory, {score: '$scoreFinal', idRegistro: '$recordId'} ) riskCategory;
    
    @api cardTitle;
    @api riskAssessmentDefinitionName;
    @api recordId = null;

    @track nomeContato = '';
    @track telefoneContato = '';
    @track emailContato = '';

    mostrarCalcularCategoriaRisco = false;
    respostas = new Map();
    score = new Map();
    scoreFinal = 0;
    sectionHandler = -1;
    questionHandler = -1;
    hideSection = false;
    hideQuestion = false;
    firstSectionEval = true;
    firstQuestionEval = true;
    
    message;
    error;

    get firstSection() {
        this.firstSectionEval = true;
        this.sectionHandler = -1;
        return "";
    }

    get notFirstSection() {
        this.firstSectionEval = false;
        return "";
    }

    get firstQuestion() {
        this.firstQuestionEval = this.firstSectionEval;
        this.questionHandler = -1;
        return "";
    }

    get notFirstQuestion() {
        this.firstQuestionEval = false;
        return "";
    }



    get sectionClass() {
        var sectionClassName = "";
        this.sectionHandler += 1;
        if (this.firstSectionEval) {
            sectionClassName = "slds-is-expanded ";
        } else {
            sectionClassName = "slds-is-collapsed ";
        }
        if (this.sections.data[this.sectionHandler] != null) {
            sectionClassName += this.sections.data[this.sectionHandler].sectionHTMLId;
        }
        
        return sectionClassName;
    }

    get questionClass() {
        var questionClassName = "";
        this.questionHandler += 1;
        if (this.firstQuestionEval) {
            questionClassName = "slds-is-expanded ";
        } else {
            questionClassName = "slds-is-collapsed ";
        }
        if (this.sections.data[this.sectionHandler] != null &&
            this.sections.data[this.sectionHandler].questions[this.questionHandler] != null) {
            questionClassName += this.sections.data[this.sectionHandler].questions[this.questionHandler].questionHTMLId;
        }
        
        return questionClassName;
    }

    get hideSpinner() {
        if (this.template.querySelector('.spinner-show') != null) {
            this.template.querySelector('.spinner-show').className = 'spinner-hide';
        }
        return "";
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

    handleContactFieldsChanges(evt) {
        const field = evt.target.name;
        if (field === 'nomeContato') {
            this.nomeContato = evt.target.value;
        } else if (field === 'telefoneContato') {
            this.telefoneContato = evt.target.value;
        } else if (field === 'emailContato') {
            this.emailContato = evt.target.value;
        }
    }

    handleClickAbrirChamado(evt) {
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

            var formularioRespondido = '';
            this.respostas.forEach(function(value, key) {
                formularioRespondido += key + ': ' + value + '\n'
            });

            if (this.nomeContato === '') {
                this.nomeContato = this.riskCategory.data.nomeContato;
            }
            if (this.telefoneContato === '') {
                this.telefoneContato = this.riskCategory.data.phone;
            }
            if (this.emailContato === '') {
                this.emailContato = this.riskCategory.data.email;
            }

            let createUpdateCaseRequest = {
                riskCategoryId: this.riskCategory.data.categoryId,
                respostas: formularioRespondido,
                nomeContato: this.nomeContato,
                email: this.emailContato,
                phone: this.telefoneContato
            };

            createUpdateCase({request: createUpdateCaseRequest})
                .then((result) => {
                    const evt = new ShowToastEvent({
                        title: 'Sucesso',
                        message: 'Chamado aberto com sucesso.',
                        variant: 'success',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(evt);

                    this[NavigationMixin.Navigate]({
                        type: 'standard__recordPage',
                        attributes: {
                            recordId: result,
                            objectApiName: 'Case',
                            actionName: 'view'
                        }
                    });
                })
                .catch((error) => {
                    const evt = new ShowToastEvent({
                        title: 'Erro',
                        message: 'Aconteceu um erro ao criar chamado. Contate seu administrador.',
                        variant: 'error',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(evt);

                    if (this.template.querySelector('.spinner-show') != null) {
                        this.template.querySelector('.spinner-show').className = 'spinner-hide';
                    }
                });

        }
    }
}
