<?php
namespace Magento\LoginAsCustomerAdminUi\Controller\Adminhtml\Login\Login;

/**
 * Interceptor class for @see \Magento\LoginAsCustomerAdminUi\Controller\Adminhtml\Login\Login
 */
class Interceptor extends \Magento\LoginAsCustomerAdminUi\Controller\Adminhtml\Login\Login implements \Magento\Framework\Interception\InterceptorInterface
{
    use \Magento\Framework\Interception\Interceptor;

    public function __construct(\Magento\Backend\App\Action\Context $context, \Magento\Backend\Model\Auth\Session $authSession, \Magento\Store\Model\StoreManagerInterface $storeManager, \Magento\Customer\Api\CustomerRepositoryInterface $customerRepository, \Magento\LoginAsCustomerApi\Api\ConfigInterface $config, \Magento\LoginAsCustomerApi\Api\Data\AuthenticationDataInterfaceFactory $authenticationDataFactory, \Magento\LoginAsCustomerApi\Api\SaveAuthenticationDataInterface $saveAuthenticationData, \Magento\LoginAsCustomerApi\Api\DeleteAuthenticationDataForUserInterface $deleteAuthenticationDataForUser, \Magento\Framework\Url $url, ?\Magento\Customer\Model\Config\Share $share = null, ?\Magento\Store\Model\StoreSwitcher\ManageStoreCookie $manageStoreCookie = null, ?\Magento\LoginAsCustomerApi\Api\SetLoggedAsCustomerCustomerIdInterface $setLoggedAsCustomerCustomerId = null, ?\Magento\LoginAsCustomerApi\Api\IsLoginAsCustomerEnabledForCustomerInterface $isLoginAsCustomerEnabled = null, ?\Magento\LoginAsCustomerApi\Api\GenerateAuthenticationSecretInterface $generateAuthenticationSecret = null)
    {
        $this->___init();
        parent::__construct($context, $authSession, $storeManager, $customerRepository, $config, $authenticationDataFactory, $saveAuthenticationData, $deleteAuthenticationDataForUser, $url, $share, $manageStoreCookie, $setLoggedAsCustomerCustomerId, $isLoginAsCustomerEnabled, $generateAuthenticationSecret);
    }

    /**
     * {@inheritdoc}
     */
    public function execute() : \Magento\Framework\Controller\ResultInterface
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'execute');
        return $pluginInfo ? $this->___callPlugins('execute', func_get_args(), $pluginInfo) : parent::execute();
    }

    /**
     * {@inheritdoc}
     */
    public function dispatch(\Magento\Framework\App\RequestInterface $request)
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'dispatch');
        return $pluginInfo ? $this->___callPlugins('dispatch', func_get_args(), $pluginInfo) : parent::dispatch($request);
    }

    /**
     * {@inheritdoc}
     */
    public function _processUrlKeys()
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, '_processUrlKeys');
        return $pluginInfo ? $this->___callPlugins('_processUrlKeys', func_get_args(), $pluginInfo) : parent::_processUrlKeys();
    }

    /**
     * {@inheritdoc}
     */
    public function getUrl($route = '', $params = [])
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getUrl');
        return $pluginInfo ? $this->___callPlugins('getUrl', func_get_args(), $pluginInfo) : parent::getUrl($route, $params);
    }

    /**
     * {@inheritdoc}
     */
    public function getActionFlag()
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getActionFlag');
        return $pluginInfo ? $this->___callPlugins('getActionFlag', func_get_args(), $pluginInfo) : parent::getActionFlag();
    }

    /**
     * {@inheritdoc}
     */
    public function getRequest()
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getRequest');
        return $pluginInfo ? $this->___callPlugins('getRequest', func_get_args(), $pluginInfo) : parent::getRequest();
    }

    /**
     * {@inheritdoc}
     */
    public function getResponse()
    {
        $pluginInfo = $this->pluginList->getNext($this->subjectType, 'getResponse');
        return $pluginInfo ? $this->___callPlugins('getResponse', func_get_args(), $pluginInfo) : parent::getResponse();
    }
}
