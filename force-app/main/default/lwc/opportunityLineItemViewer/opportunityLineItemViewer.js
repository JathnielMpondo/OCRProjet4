import { LightningElement, api, wire, track } from 'lwc'; 
import { getRecord } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';
import PROFILE_NAME_FIELD from '@salesforce/schema/User.Profile.Name';
import getOppLineItemByOppId from '@salesforce/apex/OppLineItemController.getOppLineItemByOppId';
import deleteOpportunityLineItem from '@salesforce/apex/OppLineItemController.deleteOpportunityLineItem';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const AUTHORIZED_PROFILES = ['System Administrator', 'Custom: Sales Profile']; // Profils autorisés pour voir le bouton "Voir produit" 

export default class OpportunityLineItemViewer extends LightningElement {  // Composant LWC pour afficher les lignes d'opportunité 
    @api recordId; // ID de l'opportunité 
    opportunityLines = []; // Lignes d'opportunité 
    hasError = false; // Indicateur d'erreur
    errorMessage = ''; // Message d'erreur
    userProfile; // Profil de l'utilisateur 
    isAdminOrCommercial = false; // Indicateur si l'utilisateur est admin ou commercial 

    @track isModalOpen = false; // Indicateur d'ouverture de la modale de confirmation de suppression de la ligne d'opportunité produit
    @track lineToDelete = null; // ID de la ligne d'opportunité produit à supprimer 

    @wire(getRecord, { recordId: USER_ID, fields: [PROFILE_NAME_FIELD] }) // Récupération du profil de l'utilisateur connecté 
    user({ data, error }) { // Récupération du profil de l'utilisateur connecté 
        if (data?.fields?.Profile?.displayValue) {
            const profileName = data.fields.Profile.displayValue;
            this.userProfile = profileName;
            this.isAdminOrCommercial = AUTHORIZED_PROFILES.includes(profileName);
        } else {
            this.isAdminOrCommercial = false;
            console.error('Erreur de profil utilisateur', error);
        }
    }

    get columns() { // Définition des colonnes du tableau de lignes d'opportunité produit 
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

    get hasLines() { // Vérification si des lignes d'opportunité existent 
        return this.opportunityLines.length > 0; 
    }

    connectedCallback() { // Méthode appelée lors de l'initialisation du composant 
        this.loadData(); // Chargement des données 
    }

    loadData() { // Chargement des lignes d'opportunité produit 
        getOppLineItemByOppId({ opportunityId: this.recordId }) // Appel de la méthode Apex pour récupérer les lignes d'opportunité produit 
            .then(data => { // Traitement des données récupérées 
                this.opportunityLines = data.map(item => { // Transformation des données pour le tableau 
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

                this.hasError = this.opportunityLines.some(row => row.stock < row.quantity); // Vérification de l'erreur de quantité 

                if (this.hasError) {
                    this.errorMessage =
                        "⚠️ Vous avez au moins une ligne avec un problème de quantité. Veuillez supprimer cette ligne ou réduire sa quantité. Si vous avez absolument besoin de plus de produits, veuillez contacter votre administrateur système.";
                }

            })
            .catch(error => { // Gestion des erreurs lors de la récupération des lignes d'opportunité produit 
                console.error('Erreur chargement lignes :', error);
                this.showToast('Erreur', error.body.message, 'error');
            });
    }

    handleRowAction(event) { // Gestion de l'action sur la ligne du tableau 
        const action = event.detail.action.name;
        const row = event.detail.row;

        if (action === 'delete') {
            this.lineToDelete = row.id;
            this.isModalOpen = true;
        } else if (action === 'viewProduct' && this.userProfile === 'System Administrator') {
            window.open('/' + row.productId, '_blank');
        }
    }

    confirmDelete() { // Confirmation de la suppression de la ligne d'opportunité produit 
        deleteOpportunityLineItem({ lineItemId: this.lineToDelete }) // Appel de la méthode Apex pour supprimer la ligne d'opportunité produit 
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

    cancelDelete() { // Annulation de la suppression de la ligne d'opportunité produit 
        this.isModalOpen = false;
        this.lineToDelete = null;
    }

    showToast(title, message, variant) { // Affichage d'une notification 
        this.dispatchEvent(
            new ShowToastEvent({ title, message, variant })
        );
    }
}