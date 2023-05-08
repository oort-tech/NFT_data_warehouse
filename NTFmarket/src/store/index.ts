import {createStore} from "vuex";
import Web3 from "web3";
import NFTMarketplace from "../../build/contracts/NFTMarketplace.json";

export default createStore({
    state: {
        provider: {},
        account: "",
        balance: "",
        networkId: 0,
        contract: undefined,
        listPrice: ""
    },
    getters: {},
    mutations: {
        InitWeb3(state, payload) {
            state.provider = payload.web3;
            state.account = payload.account;
            state.balance = payload.balance;
            state.networkId = payload.networkId;
            state.contract = payload.contract;
            state.listPrice = payload._listingPrice;
        }
    },
    actions: {
        async getWeb3({commit}) {
            let web3 = new Web3((window as any).ethereum);
            // console.log(web3)
            const accounts = await web3.eth.getAccounts();
            const account=accounts[0];
            const balance = await web3.eth.getBalance(accounts[0]);
            const networkId = await web3.eth.net.getId();
            const contract = new web3.eth.Contract((NFTMarketplace as any).abi, NFTMarketplace.networks[networkId].address);
            let _listingPrice = Web3.utils.toWei("0.025", "ether");
            commit("InitWeb3", {web3,account,balance,networkId,contract,_listingPrice})
            const networkType = await web3.eth.net.getNetworkType();
            console.log(networkType);
        }
    },
    modules: {},
});
