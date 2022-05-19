package mqtt_pratice;

import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

public class MqttPublisher_API3 implements MqttCallback{ // implement callback 추가 & 필요한 메소드 정의
	static MqttClient sampleClient;// Mqtt Client 객체 선언
	static String ReqDate="";
	static boolean isCheck = true;
	//2018102723,2018102722,2018102721,2018102720,2018102719
    public static void main(String[] args) {
    	MqttPublisher_API3 obj = new MqttPublisher_API3();
    	obj.run();
    }
    public void run() {    	
    	connectBroker(); // 브로커 서버에 접속
    	try { // 여기 추가
    		sampleClient.subscribe("date");
		} catch (MqttException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
    	
    	while(true) {
    		try {
    			if(isCheck == true) {
    				String[] dates = ReqDate.split(",");
        			
        			for(int i = 0; i<dates.length;i++){
        				String[] farmInfo = get_farmInfo(dates[i]);
        				
            	       	publish_data("inTp","{\"inTp\":"+farmInfo[0]+"}");
            	       	publish_data("inHd","{\"inHd\":"+farmInfo[1]+"}");
            	       	publish_data("inCo2","{\"inCo2\":"+farmInfo[2]+"}");
            	       	Thread.sleep(1);
        			}
        			
        			System.out.println("-------------------------------------------------");
        			
        			isCheck = false;
    			}
    			
    	       	
    	       	Thread.sleep(5000); // @@@@@@
    		}catch (Exception e) {
    			// TODO: handle exception
    			try {
    				sampleClient.disconnect();
    			} catch (MqttException e1) {
    				// TODO Auto-generated catch block
    				e1.printStackTrace();
    			}
    			e.printStackTrace();
    	        System.out.println("Disconnected");
    	        System.exit(0);
    		}
    	}
    }
    
    public void connectBroker() {
        String broker = "tcp://127.0.0.1:1883"; // 브로커 서버의 주소 
        String clientId = "practice"; // 클라이언트의 ID
        MemoryPersistence persistence = new MemoryPersistence();
        try {
            sampleClient = new MqttClient(broker, clientId, persistence);// Mqtt Client 객체 초기화
            MqttConnectOptions connOpts = new MqttConnectOptions(); // 접속시 접속의 옵션을 정의하는 객체 생성
            connOpts.setCleanSession(true);
            System.out.println("Connecting to broker: "+broker);
            sampleClient.connect(connOpts); // 브로커서버에 접속
            sampleClient.setCallback(this);// Call back option 추가
            System.out.println("Connected");
        } catch(MqttException me) {
            System.out.println("reason "+me.getReasonCode());
            System.out.println("msg "+me.getMessage());
            System.out.println("loc "+me.getLocalizedMessage());
            System.out.println("cause "+me.getCause());
            System.out.println("excep "+me);
            me.printStackTrace();
        }
    }
    
    public void publish_data(String topic_input, String data) { // @@@@@ 스태틱 제거
        String topic = topic_input; // 토픽
        int qos = 0; // QoS level
        try {
            System.out.println("Publishing message: "+data);
            sampleClient.publish(topic, data.getBytes(),qos, false);
            System.out.println("Message published");
        } catch(MqttException me) {
            System.out.println("reason "+me.getReasonCode());
            System.out.println("msg "+me.getMessage());
            System.out.println("loc "+me.getLocalizedMessage());
            System.out.println("cause "+me.getCause());
            System.out.println("excep "+me);
            me.printStackTrace();
        }
    }
    
    public String[] get_farmInfo(String dates) {
    	
    	String url="http://apis.data.go.kr/1390000/SmartFarmdata/envdatarqst"
    			+"?serviceKey=kbR85DTpStXq3O5a4yRTgPLcM8UvK7dUmA1%2FvXiaap8wVMuUPb6%2F9AJjbmdA4sbIbvcXv9jpiEG8Z0WxnZQN8Q%3D%3D"
    			+"&pageSize=10"
    			+"&pageNo=1"
    			+"&&searchFrmhsCode=315"
    			+"&searchMeasDt="+dates
    			+"&returnType=xml";
    	
    	String inTp= "0";
    	String inHd="0";
    	String inCo2 = "0";
    	
    	Document doc =null;
    	
    	try {
    		doc = Jsoup.connect(url).get();
    	}catch(IOException e) {
    		e.printStackTrace();
    	}
    	
    	Elements elements = doc.select("item");
    	for(Element e :elements) {
    		inTp = e.select("inTp").text();
    		inHd = e.select("inHd").text();
    		inCo2 = e.select("inCo2").text();
    		
    	}
    	
    	String[] out= {inTp,inHd,inCo2};
    	
    	return out;
    }
    ///@@@@@@@@@@@@@@@@@
	@Override
	public void connectionLost(Throwable arg0) {
		// TODO Auto-generated method stub
		System.out.println("Connection lost");
	}

	@Override
	public void deliveryComplete(IMqttDeliveryToken arg0) {
		// TODO Auto-generated method stub
	}

	@Override
	public void messageArrived(String topic, MqttMessage msg) throws Exception {
		// TODO Auto-generated method stub
		if(topic.equals("date")) {
			System.out.println("--------------------------------");
			System.out.println("ReqDate :"+msg.toString());
			ReqDate = msg.toString();
			System.out.println("--------------------------------");
			isCheck=true;
		}
	}
}

