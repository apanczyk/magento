<?php
namespace Magento\SalesRule\Model\Quote\Discount;

/**
 * Interceptor class for @see \Magento\SalesRule\Model\Quote\Discount
 */
class Interceptor extends \Magento\SalesRule\Model\Quote\Discount implements \Magento\Framework\Interception\InterceptorInterface
{
    use \Magento\Framework\Interception\Interceptor;

    public function __construct(\Magento\Framework\Event\ManagerInterface $eventManager, \Magento\Store\Model\StoreManagerInterface $storeManager, \Magento\SalesRule\Model\Validator $validator, \Magento\Framework\Pricing\PriceCurrencyInterface $priceCurrency, ?\Magento\SalesRule\Api\Data\RuleDiscountInterfaceFactory $discountInterfaceFactory = null, ?\Magento\SalesRule\Api\Data\DiscountDataInterfaceFactory $discountDataInterfaceFactory = null)
    {
        $this->___init();
        parent::__construct($eventManager, $storeManager, $validator, $priceCurrency, $discountInterfaceFactory, $discountDataInterfaceFactory);
    }

    /**
     * {@inheritdoc}
     */
    public function collect(\Magento\Quote\Model\Quote $quote, \Magento\Quote\Api\Data\ShippingAssignmentInterface $shippingAssignment, \Magento\Quote\Model\Quote\Address\Total $total)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'collect');
        return $pluginInfo ? $this->___callPlugins('collect', func_get_args(), $pluginInfo) : parent::collect($quote, $shippingAssignment, $total);
    }

    /**
     * {@inheritdoc}
     */
    public function fetch(\Magento\Quote\Model\Quote $quote, \Magento\Quote\Model\Quote\Address\Total $total)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'fetch');
        return $pluginInfo ? $this->___callPlugins('fetch', func_get_args(), $pluginInfo) : parent::fetch($quote, $total);
    }

    /**
     * {@inheritdoc}
     */
    public function setCode($code)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'setCode');
        return $pluginInfo ? $this->___callPlugins('setCode', func_get_args(), $pluginInfo) : parent::setCode($code);
    }

    /**
     * {@inheritdoc}
     */
    public function getCode()
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getCode');
        return $pluginInfo ? $this->___callPlugins('getCode', func_get_args(), $pluginInfo) : parent::getCode();
    }

    /**
     * {@inheritdoc}
     */
    public function getLabel()
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getLabel');
        return $pluginInfo ? $this->___callPlugins('getLabel', func_get_args(), $pluginInfo) : parent::getLabel();
    }

    /**
     * {@inheritdoc}
     */
    public function _setTotal(\Magento\Quote\Model\Quote\Address\Total $total)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, '_setTotal');
        return $pluginInfo ? $this->___callPlugins('_setTotal', func_get_args(), $pluginInfo) : parent::_setTotal($total);
    }

    /**
     * {@inheritdoc}
     */
    public function getItemRowTotal(\Magento\Quote\Model\Quote\Item\AbstractItem $item)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getItemRowTotal');
        return $pluginInfo ? $this->___callPlugins('getItemRowTotal', func_get_args(), $pluginInfo) : parent::getItemRowTotal($item);
    }

    /**
     * {@inheritdoc}
     */
    public function getItemBaseRowTotal(\Magento\Quote\Model\Quote\Item\AbstractItem $item)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getItemBaseRowTotal');
        return $pluginInfo ? $this->___callPlugins('getItemBaseRowTotal', func_get_args(), $pluginInfo) : parent::getItemBaseRowTotal($item);
    }

    /**
     * {@inheritdoc}
     */
    public function getIsItemRowTotalCompoundable(\Magento\Quote\Model\Quote\Item\AbstractItem $item)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getIsItemRowTotalCompoundable');
        return $pluginInfo ? $this->___callPlugins('getIsItemRowTotalCompoundable', func_get_args(), $pluginInfo) : parent::getIsItemRowTotalCompoundable($item);
    }

    /**
     * {@inheritdoc}
     */
    public function processConfigArray($config, $store)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'processConfigArray');
        return $pluginInfo ? $this->___callPlugins('processConfigArray', func_get_args(), $pluginInfo) : parent::processConfigArray($config, $store);
    }
}
