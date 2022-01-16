<?php
namespace Klarna\Core\Model\Api\Rest\Service;

/**
 * Interceptor class for @see \Klarna\Core\Model\Api\Rest\Service
 */
class Interceptor extends \Klarna\Core\Model\Api\Rest\Service implements \Magento\Framework\Interception\InterceptorInterface
{
    use \Magento\Framework\Interception\Interceptor;

    public function __construct(\Psr\Log\LoggerInterface $log, ?\Klarna\Core\Logger\Api\Logger $apiLogger = null, ?\Klarna\Core\Logger\Api\Container $loggerContainer = null)
    {
        $this->___init();
        parent::__construct($log, $apiLogger, $loggerContainer);
    }

    /**
     * {@inheritdoc}
     */
    public function setUserAgent($product, $version, $mageInfo)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'setUserAgent');
        return $pluginInfo ? $this->___callPlugins('setUserAgent', func_get_args(), $pluginInfo) : parent::setUserAgent($product, $version, $mageInfo);
    }

    /**
     * {@inheritdoc}
     */
    public function setHeader($header, $value = null)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'setHeader');
        return $pluginInfo ? $this->___callPlugins('setHeader', func_get_args(), $pluginInfo) : parent::setHeader($header, $value);
    }

    /**
     * {@inheritdoc}
     */
    public function makeRequest($url, $body = [], $method = 'post', ?string $klarnaId = null)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'makeRequest');
        return $pluginInfo ? $this->___callPlugins('makeRequest', func_get_args(), $pluginInfo) : parent::makeRequest($url, $body, $method, $klarnaId);
    }

    /**
     * {@inheritdoc}
     */
    public function connect($username, $password, $connectUrl = null)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'connect');
        return $pluginInfo ? $this->___callPlugins('connect', func_get_args(), $pluginInfo) : parent::connect($username, $password, $connectUrl);
    }
}
