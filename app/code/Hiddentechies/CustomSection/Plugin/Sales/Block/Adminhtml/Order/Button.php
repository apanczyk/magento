<?php

namespace Magenest\CustomSection\Plugin\Sales\Block\Adminhtml\Order;

use Magento\Sales\Block\Adminhtml\Order\View as OrderView;

class Button
{
    public function beforeSetLayout(OrderView $subject)
    {
        $subject->addButton(
            'order_custom_button',
            [
                'label' => __('Custom Button'),
                'class' => __('custom-button'),
                'id' => 'order-view-custom-button',
                'onclick' => 'setLocation(\'' . $subject->getUrl('routes/controller/action') . '\')'
            ]
        );
    }
}
