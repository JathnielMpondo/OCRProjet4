import { LightningElement, api, wire, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import PROFILE_NAME_FIELD from '@salesforce/schema/User.Profile.Name';
import getOppLineItemByOppId from '@salesforce/apex/OppLineItemController.getOppLineItemByOppId';
import deleteOpportunityLineItem from '@salesforce/apex/OppLineItemController.deleteOpportunityLineItem';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const AUTHORIZED_PROFILES = ['System Administrator', 'Custom: Sales Profile'];

export default class OpportunityLineItemViewer extends LightningElement {
    @api recordId;
    opportunityLines = [];
    hasError = false;
    errorMessage = '';
    userProfile;
    isAdminOrCommercial = false;

    @track isModalOpen = false;
    @track lineToDelete = null;

    @wire(getRecord, { recordId: USER_ID, fields: [PROFILE_NAME_FIELD] })
    user({ data, error }) {
        if (data?.fields?.Profile?.displayValue) {
            const profileName = data.fields.Profile.displayValue;
            this.userProfile = profileName;
            this.isAdminOrCommercial = AUTHORIZED_PROFILES.includes(profileName);
        } else {
            this.isAdminOrCommercial = false;
            console.error('Erreur de profil utilisateur', error);
        }
    }

    get columns() {
        const baseColumns = [
            { label: 'Nom du produit', fieldName: 'productName' },
            { label: 'Prix unitaire', fieldName: 'unitPrice', type: 'currency' },
            { label: 'Prix total', fieldName: 'totalPrice', type: 'currency' },
            {
                label: 'Quantité',
                fieldName: 'quantity',
                type: 'number',
                cellAttributes: {
                    class: { fieldName: 'quantityStyle' }
                }
            },
            {
                label: 'Quantité restante',
                fieldName: 'stock',
                type: 'number',
                cellAttributes: {
                    class: { fieldName: 'stockWarning' }
                }
            },
            {
                label: 'Supprimer',
                type: 'button-icon',
                fixedWidth: 80,
                cellAttributes: {
                    class: { fieldName: 'deleteStyle' }
                },
                typeAttributes: {
                    iconName: 'utility:delete',
                    title: 'Supprimer',
                    name: 'delete',
                    alternativeText: 'Supprimer',
                    variant: 'bare'
                }
            }
        ];

        if (this.userProfile === 'System Administrator') {
            baseColumns.push({
                type: 'button',
                label: 'Voir produit',
                typeAttributes: {
                    label: 'Voir produit',
                    name: 'viewProduct',
                    variant: 'brand',
                    iconName: 'utility:view',
                    iconPosition: 'left'
                }
            });
        }

        return baseColumns;
    }

    get hasLines() {
        return this.opportunityLines.length > 0;
    }

    connectedCallback() {
        this.loadData();
    }

    loadData() {
        getOppLineItemByOppId({ opportunityId: this.recordId })
            .then(data => {
                this.opportunityLines = data.map(item => {
                    const stock = item.Product2.QuantityInStock__c;
                    const quantity = item.Quantity;
                    const isOverstock = quantity > stock;

                    return {
                        id: item.Id,
                        productId: item.Product2Id,
                        productName: item.Product2.Name,
                        unitPrice: item.UnitPrice,
                        totalPrice: item.TotalPrice,
                        quantity: quantity,
                        quantityStyle: isOverstock ? 'quantity-overstock' : 'quantity-ok',
                        quantityStyle: isOverstock ? 'slds-text-color_error slds-font-weight_bold' : 'slds-text-color_success slds-font-weight_bold',
                        stock: stock,
                        stockWarning: isOverstock ? 'cell-warning' : '',
                        deleteStyle: isOverstock ? 'delete-column-warning slds-border_left slds-border_left_error' : '',
                    };
                });

                this.hasError = this.opportunityLines.some(row => row.stock < row.quantity);

                if (this.hasError) {
                    this.errorMessage =
                        "⚠️ Vous avez au moins une ligne avec un problème de quantité. Veuillez supprimer cette ligne ou réduire sa quantité. Si vous avez absolument besoin de plus de produits, veuillez contacter votre administrateur système.";
                }

            })
            .catch(error => {
                console.error('Erreur chargement lignes :', error);
                this.showToast('Erreur', error.body.message, 'error');
            });
    }

    handleRowAction(event) {
        const action = event.detail.action.name;
        const row = event.detail.row;

        if (action === 'delete') {
            this.lineToDelete = row.id;
            this.isModalOpen = true;
        } else if (action === 'viewProduct' && this.userProfile === 'System Administrator') {
            window.open('/' + row.productId, '_blank');
        }
    }

    confirmDelete() {
        deleteOpportunityLineItem({ lineItemId: this.lineToDelete })
            .then(() => {
                this.showToast('Succès', 'Produit supprimé.', 'success');
                this.loadData();
            })
            .catch(error => {
                this.showToast('Erreur', error.body.message, 'error');
            })
            .finally(() => {
                this.isModalOpen = false;
                this.lineToDelete = null;
            });
    }

    cancelDelete() {
        this.isModalOpen = false;
        this.lineToDelete = null;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }
}



// import { LightningElement, api, wire, track } from 'lwc'; // on importe les modules nécessaires 
// import { getRecord } from 'lightning/uiRecordApi'; // on importe le module getRecord pour récupérer les données de l'enregistrement
// import USER_ID from '@salesforce/user/Id'; // on importe l'ID de l'utilisateur connecté 
// import PROFILE_NAME_FIELD from '@salesforce/schema/User.Profile.Name'; // on importe le champ du nom du profil de l'utilisateur
// import getOppLineItemByOppId from '@salesforce/apex/OppLineItemController.getOppLineItemByOppId'; // on importe la méthode Apex pour récupérer les lignes d'opportunité
// import deleteOpportunityLineItem from '@salesforce/apex/OppLineItemController.deleteOpportunityLineItem'; // on importe la méthode Apex pour supprimer une ligne d'opportunité
// import { ShowToastEvent } from 'lightning/platformShowToastEvent'; // on importe le module ShowToastEvent pour afficher des messages d'alerte

// const AUTHORIZED_PROFILES = ['System Administrator', 'Custom: Sales Profile']; // on définit les profils autorisés pour voir le bouton "Voir produit"

// export default class OpportunityLineItemViewer extends LightningElement { // on définit la classe principale du composant
//     @api recordId; // on définit la propriété recordId pour récupérer l'ID de l'enregistrement d'opportunité
//     opportunityLines = []; // on définit un tableau pour stocker les lignes d'opportunité
//     hasError = false; // on définit une variable pour indiquer s'il y a une erreur
//     errorMessage = ''; // on définit une variable pour stocker le message d'erreur
//     userProfile; // on définit une variable pour stocker le profil de l'utilisateur
//     isAdminOrCommercial = false; // on définit une variable pour indiquer si l'utilisateur est administrateur ou commercial

//     @track isModalOpen = false; // on définit une variable pour indiquer si la modale de confirmation est ouverte
//     @track lineToDelete = null; // on définit une variable pour stocker l'ID de la ligne à supprimer

//     @wire(getRecord, { recordId: USER_ID, fields: [PROFILE_NAME_FIELD] }) // on utilise le décorateur @wire pour récupérer les données de l'utilisateur connecté
//     user({ data, error }) { // on définit une méthode pour traiter les données récupérées
//         if (data?.fields?.Profile?.displayValue) {
//             const profileName = data.fields.Profile.displayValue;
//             this.userProfile = profileName;
//             this.isAdminOrCommercial = AUTHORIZED_PROFILES.includes(profileName);
//         } else {
//             this.isAdminOrCommercial = false;
//             console.error('Erreur de profil utilisateur', error); // on affiche une erreur si le profil de l'utilisateur n'est pas récupéré
//         }
//     }

//     get columns() { // on définit une méthode pour récupérer les colonnes du tableau
//         const baseColumns = [ // on définit les colonnes de base du tableau
//             { label: 'Nom du produit', fieldName: 'productName' },
//             { label: 'Prix unitaire', fieldName: 'unitPrice', type: 'currency' },
//             { label: 'Prix total', fieldName: 'totalPrice', type: 'currency' },
//             {
//                 label: 'Quantité',
//                 fieldName: 'quantity',
//                 type: 'number',
//                 cellAttributes: { // on définit les attributs de la cellule 
//                     class: { fieldName: 'quantityStyle' } // on applique un style conditionnel à la cellule
//                 }
//             },
//             {
//                 label: 'Quantité restante',
//                 fieldName: 'stock',
//                 type: 'number',
//                 cellAttributes: {
//                     class: { fieldName: 'stockWarning' }
//                 }
//             },
//             {
//                 label: 'Supprimer',
//                 type: 'button-icon',
//                 fixedWidth: 80,
//                 cellAttributes: {
//                     class: { fieldName: 'deleteStyle' }
//                 },
//                 typeAttributes: { // on définit les attributs du bouton de suppression
//                     iconName: 'utility:delete',
//                     title: 'Supprimer',
//                     name: 'delete',
//                     alternativeText: 'Supprimer',
//                     variant: 'bare' // on définit le style du bouton
//                 }
//             }
//         ];

//         if (this.userProfile === 'System Administrator') {
//             baseColumns.push({
//                 type: 'button',
//                 label: 'Voir produit',
//                 typeAttributes: {
//                     label: 'Voir produit',
//                     name: 'viewProduct',
//                     variant: 'brand',
//                     iconName: 'utility:view',
//                     iconPosition: 'left'
//                 }
//             });
//         }        

//         return baseColumns;
//     }

//     get hasLines() { // on définit une méthode pour vérifier si le tableau de lignes d'opportunité est vide
//         return this.opportunityLines.length > 0; // on retourne vrai si le tableau n'est pas vide
//     }

//     connectedCallback() { // on définit une méthode qui est appelée lorsque le composant est inséré dans le DOM
//         this.loadData(); // on appelle la méthode pour charger les données
//     }

//     loadData() {
//         getOppLineItemByOppId({ opportunityId: this.recordId })
//             .then(data => {
//                 this.opportunityLines = data.map(item => {
//                     const stock = item.Product2.QuantityInStock__c;
//                     const quantity = item.Quantity;
//                     const isOverstock = quantity > stock;
//                     console.log(
//                         `Ligne ${item.Id} → quantité=${quantity}, stock=${stock}, surstock=${isOverstock}`
//                       );
//                     return {
//                         id: item.Id,
//                         productId: item.Product2Id,
//                         productName: item.Product2.Name,
//                         unitPrice: item.UnitPrice,
//                         totalPrice: item.TotalPrice,
//                         quantity: quantity,
//                         quantityStyle: isOverstock ? 'quantity-overstock' : 'quantity-ok',
//                         stock: stock,
//                         stockWarning: isOverstock ? 'cell-warning' : '',
//                         deleteStyle: isOverstock ? 'delete-column-warning' : ''
//                     };
//                 });
    
//                 this.hasError = this.opportunityLines.some(line => line.stock < line.quantity);
    
//                 if (this.hasError) {
//                     this.errorMessage =
//                         "⚠️ Vous avez au moins une ligne avec un problème de quantité. Veuillez supprimer cette ligne ou réduire sa quantité. Si vous avez absolument besoin de plus de produits, veuillez contacter votre administrateur système.";
//                 }
//                 console.log('opportunityLines transformées :', this.opportunityLines);
//             })
//             .catch(error => {
//                 console.error('Erreur chargement lignes :', error);
//                 this.showToast('Erreur', error.body.message, 'error');
//             });
//     }    

//     handleRowAction(event) { // on définit une méthode pour gérer les actions sur les lignes du tableau
//         // on récupère l'action et la ligne sur laquelle l'utilisateur a cliqué
//         // on utilise event.detail pour récupérer les informations sur l'action
//         // on utilise event.detail.row pour récupérer les informations sur la ligne
//         const action = event.detail.action.name;
//         const row = event.detail.row;

//         if (action === 'delete') { // on vérifie si l'action est de supprimer une ligne 
//             this.lineToDelete = row.id;
//             this.isModalOpen = true;
//         } else if (action === 'viewProduct' && this.userProfile === 'System Administrator') { // on vérifie si l'action est de voir le produit
//             // on ouvre une nouvelle fenêtre pour afficher le produit
//             // on utilise row.productId pour récupérer l'ID du produit
//             window.open('/' + row.productId, '_blank');
//         }
//     }

//     confirmDelete() {
//         deleteOpportunityLineItem({ lineItemId: this.lineToDelete })
//             .then(() => {
//                 this.showToast('Succès', 'Produit supprimé.', 'success');
//                 this.loadData();
//             })
//             .catch(error => {
//                 this.showToast('Erreur', error.body.message, 'error');
//             })
//             .finally(() => {
//                 this.isModalOpen = false;
//                 this.lineToDelete = null;
//             });
//     }

//     cancelDelete() { // on définit une méthode pour annuler la suppression
//         // on ferme la modale de confirmation
//         this.isModalOpen = false; // on remet la variable isModalOpen à false
//         this.lineToDelete = null; // on remet la variable lineToDelete à null
//     }

//     showToast(title, message, variant) { // on définit une méthode pour afficher un message d'alerte
//         // on utilise le module ShowToastEvent pour afficher un message d'alerte
//         // on utilise this.dispatchEvent pour déclencher l'événement ShowToastEvent
//         this.dispatchEvent( // on déclenche l'événement ShowToastEvent
//             new ShowToastEvent({ title, message, variant }) // on crée une nouvelle instance de ShowToastEvent avec les paramètres title, message et variant
//         );
//     }
// }