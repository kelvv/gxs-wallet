<template>
  <div>
    <div class="page-group">
      <div class="page">
        <header class="bar bar-nav">
          <h3 class="title">{{$t('realtime_quotations.title')}}</h3>
          <router-link :to="link('/')" replace class="icon icon-left"></router-link>
        </header>
        <div class="content">
          <div class="exchange">
            <div class="exchange-title">
              <div class="asset-name">{{exchange_symbol}}</div>
              <div class="exchange-name">{{exchange_name}}</div>
            </div>
            <div class="exchange-price">
              <div class="price-primary">
                {{exchange_price}}
              </div>
              <div class="price-secondary">
                {{_i18n.locale == 'zh-CN' ? `￥${exchange_price_rmb}` : `$${exchange_price_dollar}`}}
              </div>
            </div>
            <div class="exchange-quote">
              <div class="quote" :class="{green:exchange_quote>0}">
                {{(exchange_quote > 0 ? '+' : '') + (exchange_quote) + '%'}}
              </div>
            </div>
          </div>

          <div class="quotations">
            <div class="quotation-item">
              <div class="quotation-item-title">
                {{$t('realtime_quotations.high')}}
              </div>
              <div class="quotation-item-value">
                {{high}}
              </div>
            </div>
            <div class="quotation-item">
              <div class="quotation-item-title">
                {{$t('realtime_quotations.low')}}
              </div>
              <div class="quotation-item-value">
                {{low}}
              </div>
            </div>
            <div class="quotation-item">
              <div class="quotation-item-title">
                {{$t('realtime_quotations.volume')}}
              </div>
              <div class="quotation-item-value">
                {{volume}}
              </div>
            </div>
          </div>
          <div class="chart">
            <div class="buttons-row">
              <a :class="{active:tabIndex==0}" @click="loadTimeData"
                class="tab-link button">{{$t('realtime_quotations.time_sharing')}}</a>
              <a :class="{active:tabIndex==1}" @click="loadKlineData"
                class="tab-link button">{{$t('realtime_quotations.k_line')}}</a>
            </div>
            <div class="tabs">
              <div class="tab" :class="{active:tabIndex==0}">
                <div id="time-sharing"></div>
              </div>
              <div class="tab" :class="{active:tabIndex==1}">
                <div id="k-line"></div>
              </div>
            </div>
          </div>
          <div class="strategy">
            <a v-if="_i18n.locale == 'zh-CN'" @click="showStrategyModal">{{$t('realtime_quotations.strategy')+'>'}}></a>
          </div>
        </div>
      </div>
    </div>
  
    <div v-if="exchange_name === 'Binance'">
      <binance-strategy  ref="strategy"></binance-strategy>
    </div>
    <div v-else-if="exchange_name === 'Bit-Z'">
      <bitz-strategy  ref="strategy"></bitz-strategy>
    </div>
    <div v-else-if="exchange_name === 'Allcoin'">
      <allcoin-strategy  ref="strategy"></allcoin-strategy>
    </div>
    <div v-else-if="exchange_name === 'BigOne'">
      <bigone-strategy  ref="strategy"></bigone-strategy>
    </div>
    
  </div>
</template>
<script>
  import G2 from '@antv/g2'
  import {View} from '@antv/data-set'
  import BinanceStrategy from '@/components/BinanceStrategy.vue'
  import BitzStrategy from '@/components/BitzStrategy.vue'
  import AllcoinStrategy from '@/components/AllcoinStrategy.vue'
  import BigoneStrategy from '@/components/BigoneStrategy.vue'
  import {get_realtime_quotation,get_chart_data} from '@/services/MarketService'
  export default {
    data() {
      return {
        exchange_name: this.$route.params.exchange_name,
        exchange_symbol: this.$route.params.exchange_symbol,
        exchange_price: '',
        exchange_price_rmb: '',
        exchange_price_dollar: '',
        exchange_quote: '',
        high:'',
        low:'',
        volume:'',
        tabIndex:0,
        stopFetchingQuotation: false,
        timeData:[],
        klineData:[]
      }
    },
    methods: {
      loadRealtimeQuotation(){
        get_realtime_quotation(this.exchange_name,this.exchange_symbol).then((resp) => {
          this.exchange_price = resp.price;
          this.exchange_price_rmb = resp.price_rmb;
          this.exchange_price_dollar = resp.price_dollar;
          this.exchange_quote = resp.quote;
          this.high = resp.high;
          this.low = resp.low;
          this.volume = resp.volume;
          setTimeout(() => {
            if(!this.stopFetchingQuotation){
              this.loadRealtimeQuotation();
            }
          }, 5000);
        }).catch(ex => {
          console.error(ex);
          setTimeout(() => {
            if(!this.stopFetchingQuotation){
              this.loadRealtimeQuotation();
            }
          }, 5000);
        })
      },
      loadTimeData(){
        this.tabIndex = 0;
        if(this.timeData.length == 0){
          get_chart_data(this.exchange_name,this.exchange_symbol,'1m').then((resp) => {
          this.timeData = resp.filter((item)=>{
            return item.volumn > 0
          }).map((item)=>{
            item.pair_price = parseFloat((item.price / item.volumn).toFixed(7));
            item.time = new Date(item.timestamp).format("yyyy-MM-dd hh:mm:ss"); 
            return item;
          });
          this.renderTimeSharingG2();
          })
        }
      },
      loadKlineData(){
        this.tabIndex = 1;
        if(this.klineData.length == 0){
          get_chart_data(this.exchange_name,this.exchange_symbol,'1440m').then((resp) => {
          this.klineData = resp.map((r) => {
            r.time = new Date(r.timestamp).format("yyyy-MM-dd hh:mm:ss");  
            r.max = parseFloat(r.max);
            r.min = parseFloat(r.min);
            r.start = parseFloat(r.start);
            r.end = parseFloat(r.end);
            r.volumn = parseFloat(r.volumn);
            r.money = parseFloat(r.price);
            return r;
          });
          this.renderKLineG2();
          })
        }
      },
      renderKLineG2(){
        const dv = new View();
        dv.source(this.klineData)
        .transform({
          type: 'map',
          callback: obj => {
            obj.trend = (obj.start <= obj.end) ? '上涨' : '下跌';
            obj.range = [ obj.start, obj.end, obj.max, obj.min ];
            return obj;
          }
        });
        const chart = new G2.Chart({
          container: 'k-line',
          forceFit: true,
          height: 420,
          animate: true,
        });
        chart.source(dv, {
          'time': {
            type: 'timeCat',
            nice: false,
            tickCount: 5,
            mask: 'MM-DD',
            range: [ 0, 1 ]
          },
          trend: {
            values: [ '上涨', '下跌' ]
          },
          'volumn': {alias: '成交量'},
          'start': {alias: '开盘价'},
          'end': {alias: '收盘价'},
          'max': {alias: '最高价'},
          'min': {alias: '最低价'},
          'range': {alias: '价格'}
        });
        chart.legend({
          offset: 20
        });
        chart.tooltip({
          showTitle: false,
          itemTpl: '<li data-index={index}>'
          + '<span style="background-color:{color};" class="g2-tooltip-marker"></span>'
          + '{name}{value}</li>',
        });
        const kView = chart.view({
          end: {
            x: 1,
            y: 0.5
          }
        });
        kView.source(dv);
        kView.schema()
          .position('time*range')
          .color('trend', val => {
            if (val === '上涨') {
              return '#f04864';
            }

            if (val === '下跌') {
              return '#2fc25b';
            }
          })
          .shape('candle')
          .tooltip('time*start*end*max*min', (time, start, end, max, min) => {
            return {
              name: time,
              value: '<br><span style="padding-left: 16px">开盘价：' + start + '</span><br/>'
              + '<span style="padding-left: 16px">收盘价：' + end + '</span><br/>'
              + '<span style="padding-left: 16px">最高价：' + max + '</span><br/>'
              + '<span style="padding-left: 16px">最低价：' + min + '</span>'
            };
          });
        const barView = chart.view({
          start: {
            x: 0,
            y: 0.65
          }
        });
        barView.source(dv, {
          volumn: {
            tickCount: 3
          }
        });
        barView.axis('time', {
          tickLine: null,
          label: null
        });
        barView.axis('volumn', {
          label: {
            formatter: function(val) {
              return parseInt(val / 10000, 10) + 'w';
            }
          }
        });
        barView.interval()
        .position('time*volumn')
        .color('trend',  val => {
          if (val === '上涨') {
            return '#f04864';
          }

          if (val === '下跌') {
            return '#2fc25b';
          }
        })
        .tooltip('time*volumn', (time, volumn) => {
          return {
            name: time,
            value: '<br/><span style="padding-left: 16px">成交量：' + volumn + '</span><br/>'
          };
        });

        chart.render();


      },
      renderTimeSharingG2(){
        const chart = new G2.Chart({
          container: 'time-sharing',
          forceFit: true,
          height: 420
        });
        chart.source(this.timeData);
        chart.scale({
          pair_price: {
            // min: 0.0002,
            tickCount: 5,
          },
          time: {
            type: 'timeCat',
            tickCount: 5,
            mask: 'HH:mm',
            range: [ 0, 1 ]
          }
        });
        chart.axis('pair_price', {
          label: {
            formatter: val => {
              return val
            }
          }
        });
        chart.tooltip({
          crosshairs: {
            type: 'line'
          }
        });
        chart.area().position('time*pair_price');
        chart.line().position('time*pair_price').size(1);
        chart.render();
      },
      showStrategyModal(){
        this.$refs.strategy.show();
      },
    },
    mounted() {
      $.init();
      this.loadRealtimeQuotation();
      this.loadTimeData();
    },
    components: {
      BinanceStrategy,
      BitzStrategy,
      AllcoinStrategy,
      BigoneStrategy
    }
  }

</script>
<style lang="scss" scoped>
  .content{
    background: #fff;
  }
  .exchange{
    display: flex;
    flex-direction: row;
    padding-top: .75rem;
    padding-bottom: .6rem;
    padding-left: .67rem;
    padding-right: .67rem;
    background: #fff;
    border-bottom: 1px solid #e7e7e7;
    .exchange-title{
      text-align: left;
      flex: 1;
      .asset-name{
        font-size: .7rem;
        color:#3d3d3b;
      }
      .exchange-name{
        font-size: .6rem;
        color:#888;
      }
    }
    .exchange-price{
      text-align: right;
      flex: 1;
      .price-secondary{
        font-size: .6rem;
        color:#888;
      }
    }
    .exchange-quote{
      flex: 1;
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      align-items: center;
      .quote{
        display: inline-block;
        height: 1.2rem;
        line-height: 1.2rem;
        width: 3.5rem;
        text-align: right;
        padding: 0 .2rem;
        font-weight: bold;
        font-size: .65rem;
        color: #fff;
        background: #d63932;
        &.green{
          background:#076f8a;
        }
      }
    }
  }
  .quotations{
    background: #fff;
    display: flex;
    flex-direction: row;
    padding-top: .75rem;
    padding-bottom: .65rem;
    padding-left: .67rem;
    padding-right: .67rem;
    // border-bottom: 1px solid red;
    .quotation-item{
      flex: 1;
      text-align: left;
      .quotation-item-title{
        font-size: .6rem;
        color:#888;
      }
      .quotation-item-value{
        font-size: .7rem;
        color:#3d3d3b;
      }
    }
  }
  .chart{
    height: 20rem;
    background: #fff;
    padding-left: .67rem;
    padding-right: .67rem;
    .buttons-row .button{
      border-color: #888;
      color: #3d3d3b;
      &.active{
        background: #4a586f;
        color:#fff;
      }
    }
    .tab{
      width:100%;
      height:400px;
    }
    #time-sharing{
      margin-top:1rem;
    }
    #k-line{
      margin-top:1rem;
    }
  }
  .strategy{
    height: 3rem;
    display: flex;
    justify-content: center;
    align-items: center;
    // text-align: center;
    font-size: .7rem;
  }

</style>


