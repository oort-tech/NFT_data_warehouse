<template>
    <div class="main">
        <nav style="padding: 0">
            <router-link to="/">NftMarketHome</router-link>
            |
            <router-link :to="{name:'UserInformation',query:{userId:this.account}}">UserInformation</router-link>
            |
            <router-link to="/create">CreateNft</router-link>
        </nav>
        <el-dropdown>
            <div v-html="avatar"></div>
            <template #dropdown>
                <el-dropdown-menu>
                    <p>Account: {{ account }}</p>
                    <p>Balance: {{ balance }} ETHs</p>
                    <p>Network Id: {{ networkId }}</p>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

    </div>

</template>

<script>
import jazzicon from "@metamask/jazzicon"
import Web3 from "web3";

export default {
    name: "TopBar",
    data() {
        return {
            avatar: "",
            account: "111222",
            balance: "",
            networkId: 0
        }
    },
    methods: {
        getUserInfo() {
            this.$store.watch((newState,oldState)=>{
                this.account = newState.account;
                this.balance = Web3.utils.fromWei(newState.balance,"ether");
                this.networkId = newState.networkId;
            });
        }
    },
    created() {
        this.$store.dispatch("getWeb3");
        this.avatar = jazzicon(40, Math.round(Math.random() * 10000000)).outerHTML
        this.getUserInfo()
    },
}
</script>

<style scoped>
.main {
    padding-top: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;

}

p {
    padding: 5px;
    font-weight: 400;
    font-size: 1.1rem;
}
</style>