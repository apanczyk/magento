<?php
/**
 * Copyright © Magento, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */

namespace Magento\Downloadable\Block\Sales\Order\Email\Items;

use Magento\Downloadable\Model\Link;
use Magento\Downloadable\Model\Link\Purchased;
use Magento\Downloadable\Model\Link\Purchased\Item;
use Magento\Framework\App\ObjectManager;
use Magento\Store\Model\ScopeInterface;

/**
 * Downloadable Sales Order Email items renderer
 *
 * @api
 * @since 100.0.2
 */
class Downloadable extends \Magento\Sales\Block\Order\Email\Items\DefaultItems
{
    /**
     * @var Purchased
     */
    protected $_purchased;

    /**
     * @var \Magento\Downloadable\Model\Link\PurchasedFactory
     */
    protected $_purchasedFactory;

    /**
     * @var \Magento\Downloadable\Model\ResourceModel\Link\Purchased\Item\CollectionFactory
     */
    protected $_itemsFactory;

    /**
     * @var \Magento\Framework\Url
     * @since 100.1.0
     */
    protected $frontendUrlBuilder;
    /**
     * @var \Magento\Downloadable\Model\Sales\Order\Link\Purchased
     */
    private $purchasedLink;

    /**
     * @param \Magento\Framework\View\Element\Template\Context $context
     * @param \Magento\Downloadable\Model\Link\PurchasedFactory $purchasedFactory
     * @param \Magento\Downloadable\Model\ResourceModel\Link\Purchased\Item\CollectionFactory $itemsFactory
     * @param \Magento\Framework\Url $frontendUrlBuilder
     * @param array $data
     * @param \Magento\Downloadable\Model\Sales\Order\Link\Purchased|null $purchasedLink
     */
    public function __construct(
        \Magento\Framework\View\Element\Template\Context $context,
        \Magento\Downloadable\Model\Link\PurchasedFactory $purchasedFactory,
        \Magento\Downloadable\Model\ResourceModel\Link\Purchased\Item\CollectionFactory $itemsFactory,
        \Magento\Framework\Url $frontendUrlBuilder,
        array $data = [],
        ?\Magento\Downloadable\Model\Sales\Order\Link\Purchased $purchasedLink = null
    ) {
        $this->_purchasedFactory = $purchasedFactory;
        $this->_itemsFactory = $itemsFactory;
        $this->frontendUrlBuilder = $frontendUrlBuilder;
        parent::__construct($context, $data);
        $this->purchasedLink = $purchasedLink
            ?? ObjectManager::getInstance()->get(\Magento\Downloadable\Model\Sales\Order\Link\Purchased::class);
    }

    /**
     * Enter description here...
     *
     * @return Purchased
     */
    public function getLinks()
    {
        $this->_purchased = $this->purchasedLink->getLink($this->getItem());

        return $this->_purchased;
    }

    /**
     * Returns links title
     *
     * @return null|string
     */
    public function getLinksTitle()
    {
        return $this->getLinks()->getLinkSectionTitle() ?: $this->_scopeConfig->getValue(
            Link::XML_PATH_LINKS_TITLE,
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Returns purchased link url
     *
     * @param Item $item
     * @return string
     */
    public function getPurchasedLinkUrl($item)
    {
        return $this->frontendUrlBuilder->getUrl(
            'downloadable/download/link',
            [
                'id' => $item->getLinkHash(),
                '_scope' => $this->getOrder()->getStore(),
                '_secure' => true,
                '_nosid' => true
            ]
        );
    }
}
