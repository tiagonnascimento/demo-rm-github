# Brasil sem COVID-19

Este projeto tem como objetivo entregar uma solução que facilita a triagem e o acompanhamento de pacientes suspeitos e/ou diagnosticados com COVID-19. Ele é composto por um modelo de objetos e um Lightning Web Component que pode ser utilizado em uma página agnóstica (por exemplo em uma Home Page de um Aplicativo) ou em uma página de Paciente (Person Account). Também pode ser utilizado em uma comunidade para abertura de chamado/caso. Este componente lerá do modelo de objetos o questionário e o apresentará dinamicamente para o usuário. O modelo de dados possui os seguintes objetos:

* BSC_Risk_Assessment_Definition__c: nome do questionário e container de todas as demais entidades

  * BSC_Risk_Assessment_Section__c: seção do questionário, serve como um agrupador de perguntas
    
    * BSC_Question__c: pergunta - pode ter a resposta esperada do tipo Text, Number ou List. Pode ser requerida e a última pergunta do questionário. Para as perguntas do tipo Lista também haverá um peso que será utilizado em uma média ponderada no cálculo final do risco do paciente. 
      
      * BSC_Question_Option__c: se a pergunta for do tipo Lista, as opções de resposta estarão contidas neste objeto. Possui um score que será utilizado em conjunto com o peso da pergunta para o cálculo de uma média ponderada no cálculo final do risco do paciente.

  * BSC_Risk_Category__c: Categoria de risco final que o paciente se encontra. Possui orientações para o paciente, se deve ser aberto um chamado ou atualizado algum chamado existente, a prioridade do chamado e o tipo de registro do chamado a ser aberto. Possui também um score mínimo que as respostas do formulário deverá chegar para ser encaixado nesta categoria. 

O componente pode ser deployado tanto via unlocked package quanto via metadata API - ambos usando Salesforce CLI

## Instalando o componente a partir do pacote publicado

Obtenha com o seu representante Salesforce o último ID do pacote publicado e na sua org / sandbox entre na seguinte URL: https:/<MY-DOMAIN>.lightning.force.com/packagingSetupUI/ipLanding.app?apvId=<ID_DO_PACOTE>

A senha que vai ser solicitada é "csgrockz!".

## Configuração do ambiente de desenvolvimento

Para a manipulação do componente, é necessário a instalação dos seguintes softwares:
* Salesforce CLI
* SourceTree (client git - opcional mas útil)
* Visual Studio Code com os seguintes pluggins:
    * GitLens
    * Salesforce Extension Pack
    * Salesforce CLI Integration
    * Salesforce Package.xml Generator Extension for VS Code

Você também deverá ter acesso ao repositório remoto do Bitbucket e clonar o repositório em sua máquina local.

### Deploy usando a Metadata API

Para fazer o deploy do componente usando a metadata API você precisa converter o código em metadados e então fazer o deploy. Para isto use a seguinte sequência de comandos:

* Converter o código em metadados:

```
    sfdx force:source:convert -r force-app/ -d convertedapi -x manifest/package.xml
```

* Realizar o deploy em uma sandbox / org produtiva:
```
    sfdx force:mdapi:deploy -u <ALIAS_DA_ORG> -d convertedapi/ --testlevel RunLocalTests -w 10
```

Possivelmente qualquer alteração do componente será feito numa sandbox, o que fará com que seja necessário baixar alterações desta sandbox para fazer o deploy em uma org produtiva. Para isto poderá executar o seguinte comando: 
```
    sfdx force:source:retrieve --manifest manifest/package.xml -u <ALIAS_DA_ORG/SANDBOX>
```

Note que se novos metadados forem criados, talvez seja necessário atualizar o arquivo package.xml com estes novos metadados para o comando retrieve poder obtê-los. Para isto o componente Salesforce Package.xml Generator Extension for VS Code pode ser útil. Após isto, será necessário converter o código em metadado, conforme orientado acima, e realizar o deploy novamente. 

### Deploy usando Unlocked Packages

Além de ter o Salesforce CLI instalado, você deverá ter conectado na org produtiva que será utilizada como Dev Hub (pode ser uma developer org). Para isto você precisa habilitar o Dev Hub da org produtiva, e depois executar o seguinte comando:

```
    sfdx force:auth:web:login -a <ALIAS_DA_ORG_QUE_VC_QUISER> 
```

Após isto, deverá executar a seguinte sequência de passos:

* Criar uma scratch org:

```
    sfdx force:org:create -f config/project-scratch-def.json -a <ALIAS_DA_SCRATCH_ORG_QUE_VC_QUISER> -d 30 -u <ALIAS_DO_DEV_HUB>
```

* Fazer o push do código:

```
    sfdx force:source:push -u <ALIAS_DA_SCRATCH_ORG>
```

* Fazer suas alterações que quiser e então;

* Limpar o arquivo sfdx-project.json, dando um novo nome pro componente e removendo a seção packageAliases;

* Criar o pacote:

```
    sfdx force:package:create -n <NOME_DO_COMPONENTE> -t Unlocked -r force-app/ -d <DESCRIÇÃO_DO_COMPONENTE> -v <ALIAS_DO_DEVHUB>
```
* Criar uma nova versão do pacote:

```
    sfdx force:package:version:create -p <NOME_DO_COMPONENTE> -d force-app -k <SENHA_QUE_VC_QUISER> --wait 10 -v <ALIAS_DO_DEVHUB> -f config/project-scratch-def.json 
```

* Este comando atualizará o arquivo sfdx-project.json com uma nova versão. Esta versão será utilizada para você instalar o pacote - logo abaixo. Como passo opcional pode instalar este pacote em uma nova scratch org que vc deverá criar. Este mesmo comando poderá ser utilizado para instalar o pacote em qualquer outra org produtiva após ter promovido o mesmo. Para instalar o pacote pode usar o seguinte comando:

```
    sfdx force:package:install --wait 10 --publishwait 10 --package <NOME_DO_PACOTE>@<VERSAO_DO_PACOTE> -k <SENHA_ESCOLHIDA> -r -u <ALIAS_DA_SCRATCH_ORG_NOVA>
```
* Por fim, promova o pacote com o seguinte comando:

```
    sfdx force:package:version:promote -p <NOME_DO_PACOTE>@<VERSAO_DO_PACOTE> -v <ALIAS_DO_DEVHUB>
```