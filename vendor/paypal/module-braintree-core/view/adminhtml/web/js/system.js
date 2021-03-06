require(['jquery', 'Magento_Ui/js/modal/alert', 'mage/translate', 'domReady!'], function ($, alert, $t) {
    function disablePayLaterMessages()
    {
        var merchant_country = '', allowed_countries = '', paypal_credit = '';
        merchant_country = $('[data-ui-id="adminhtml-system-config-field-country-0-select-groups-account-fields-merchant-country-value"]').val();
        paypal_credit = $('[data-ui-id="select-groups-braintree-section-groups-braintree-fields-braintree-paypal-credit-active-value"]').val();

        allowed_countries = ['GB','FR','US','DE', 'AU'];
        if($.inArray(merchant_country, allowed_countries) == -1 || paypal_credit == 1){
            //hide paylater message
            $('[data-ui-id="select-groups-braintree-section-groups-braintree-groups-braintree-paypal-groups-button-cart-fields-message-cart-enable-value"]').val(0).attr('readonly',true).click();
            $('[data-ui-id="select-groups-braintree-section-groups-braintree-groups-braintree-paypal-groups-button-checkout-fields-message-checkout-enable-value"]').val(0).attr('readonly',true).click();
            $('[data-ui-id="select-groups-braintree-section-groups-braintree-groups-braintree-paypal-groups-button-productpage-fields-message-productpage-enable-value"]').val(0).attr('readonly',true).click();
        }

    }
    window.braintreeValidator = function (endpoint, env_id) {
        env_id = $('[data-ui-id="' + env_id + '"]').val();

        var merch_id = '', public_id = '', private_id = '';

        if (env_id === 'sandbox') {
            merch_id = $('[data-ui-id="text-groups-braintree-section-groups-braintree-groups-braintree-required-fields-sandbox-merchant-id-value"]').val();
            public_id = $('[data-ui-id="password-groups-braintree-section-groups-braintree-groups-braintree-required-fields-sandbox-public-key-value"]').val();
            private_id = $('[data-ui-id="password-groups-braintree-section-groups-braintree-groups-braintree-required-fields-sandbox-private-key-value"]').val();
        } else {
            merch_id = $('[data-ui-id="text-groups-braintree-section-groups-braintree-groups-braintree-required-fields-merchant-id-value"]').val();
            public_id = $('[data-ui-id="password-groups-braintree-section-groups-braintree-groups-braintree-required-fields-public-key-value"]').val();
            private_id = $('[data-ui-id="password-groups-braintree-section-groups-braintree-groups-braintree-required-fields-private-key-value"]').val();
        }

        /* Remove previous success message if present */
        if ($(".braintree-credentials-success-message")) {
            $(".braintree-credentials-success-message").remove();
        }

        /* Basic field validation */
        var errors = [];

        if (!env_id || env_id !== 'sandbox' && env_id !== 'production') {
            errors.push($t("Please select an Environment"));
        }

        if (!merch_id) {
            errors.push($t("Please enter a Merchant ID"));
        }

        if (!public_id) {
            errors.push($t('Please enter a Public Key'));
        }

        if (!private_id) {
            errors.push($t('Please enter a Private Key'));
        }

        if (errors.length > 0) {
            alert({
                title: $t('Braintree Credential Validation Failed'),
                content:  errors.join('<br />')
            });
            return false;
        }

        $(this).text($t("We're validating your credentials...")).attr('disabled', true);

        var self = this;
        $.post(endpoint, {
            environment: env_id,
            merchant_id: merch_id,
            public_key: public_id,
            private_key: private_id
        }).done(function () {
            $('<div class="message message-success braintree-credentials-success-message">' + $t("Your credentials are valid.") + '</div>').insertAfter(self);
        }).fail(function () {
            alert({
                title: $t('Braintree Credential Validation Failed'),
                content: $t('Your Braintree Credentials could not be validated. Please ensure you have selected the correct environment and entered a valid Merchant ID, Public Key and Private Key.')
            });
        }).always(function () {
            $(self).text($t("Validate Credentials")).attr('disabled', false);
        });
    }
    disablePayLaterMessages();
});