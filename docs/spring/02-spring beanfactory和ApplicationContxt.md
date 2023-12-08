![](https://cdn.nlark.com/yuque/0/2023/jpeg/1741454/1699336972969-1d1ba913-3d31-4a09-832b-5a20487835e1.jpeg)
# BeanFactory

- BeanFactory接口提供了获取Bean的方法

![image.png](https://cdn.nlark.com/yuque/0/2022/png/1741454/1662221217171-2f2c6a01-d691-4677-9beb-a6d0d8752647.png#averageHue=%233c4349&clientId=ud191b97c-66c0-4&errorMessage=unknown%20error&from=paste&height=655&id=uab63c49e&originHeight=1310&originWidth=1500&originalType=binary&ratio=1&rotation=0&showTitle=false&size=396389&status=error&style=none&taskId=u2ee18e4f-2cb5-47d6-99b5-3feb70d07ef&title=&width=750)

- 控制反转,基本的依赖注入,以及bean的各个生命周期,都是由它的实现类提供,主要由`DefaultListableBeanFactory`实现

![DefaultListableBeanFactory.png](https://cdn.nlark.com/yuque/0/2022/png/1741454/1662261651150-b2faca18-0629-4181-b1a8-4369419e1a35.png#averageHue=%23f5f5f5&clientId=ud191b97c-66c0-4&errorMessage=unknown%20error&from=paste&height=506&id=u01444e4e&originHeight=1012&originWidth=2916&originalType=binary&ratio=1&rotation=0&showTitle=false&size=103979&status=error&style=none&taskId=ub5c4546f-d25c-4ea9-baf5-b228d638525&title=&width=1458)
```java
@SpringBootApplication
public class SpringDemo1 {
    public static void main(String[] args) throws NoSuchFieldException, IllegalAccessException {
        ConfigurableApplicationContext run = SpringApplication.run(SpringDemo1.class, args);
        ConfigurableListableBeanFactory beanFactory = run.getBeanFactory();

        //获取DefaultSingletonBeanRegistry的单例对象 map集合 ，三级缓存也在该类中
        Class<DefaultSingletonBeanRegistry> defaultSingletonBeanRegistryClass = DefaultSingletonBeanRegistry.class;
        Field singletonObjects = defaultSingletonBeanRegistryClass.getDeclaredField("singletonObjects");
        singletonObjects.setAccessible(true);
        Map<String, Object> singletonMap = (Map<String, Object>) singletonObjects.get(beanFactory);
        singletonMap.forEach((k, v) -> {
            System.out.println(k + "=" + v);
        });

    }
}
```

## DefaultListableBeanFactory
它作为BeanFactory 的实现
![DefaultListableBeanFactory.png](https://cdn.nlark.com/yuque/0/2022/png/1741454/1662261651150-b2faca18-0629-4181-b1a8-4369419e1a35.png#averageHue=%23f5f5f5&clientId=ud191b97c-66c0-4&errorMessage=unknown%20error&from=paste&height=506&id=kkRdV&originHeight=1012&originWidth=2916&originalType=binary&ratio=1&rotation=0&showTitle=false&size=103979&status=error&style=none&taskId=ub5c4546f-d25c-4ea9-baf5-b228d638525&title=&width=1458)

```java
    public static void main(String[] args) {
        //创建BeanFactory的实现
        DefaultListableBeanFactory beanFactory = new DefaultListableBeanFactory();

        //往beanFactory中注册MyConfig的BeanDefinition
        AbstractBeanDefinition myConfigBeanDefinition = BeanDefinitionBuilder.genericBeanDefinition(MyConfig.class).setScope("singleton").getBeanDefinition();
        beanFactory.registerBeanDefinition("myconfig", myConfigBeanDefinition);

        //添加几个比较重要的 bean定义  beanDefinition
        //加入了BeanFactory的后置处理器   ConfigurationClassPostProcessor 的beanDefinition ，它会扫描带有@Config的类，并把该类的@Bean 和 @Import 对于的类的BeanDefinition加入到BeanFactory中，并且添加了BeanPostProcessor加入了ImportAwareBeanPostProcessor
        //
        //加入了BeanPostProcessor处理器     AutowiredAnnotationBeanPostProcessor   CommonAnnotationBeanPostProcessor的beanDefinition 并没有实例化才
        // 先执行 BeanDefinitionRegistryPostProcessor.postProcessBeanDefinitionRegistry->  BeanFactoryPostProcessor.postProcessBeanFactory
        AnnotationConfigUtils.registerAnnotationConfigProcessors(beanFactory);


        System.out.println("==============beanFactoryPostProcess start==============================");
        //BeanFactoryPostProcessor 的  实例化
        Map<String, BeanFactoryPostProcessor> beansOfType = beanFactory.getBeansOfType(BeanFactoryPostProcessor.class);
        beansOfType.forEach((k, v) -> {
            //并且调用BeanFactoryPostProcessor的postProcessBeanFactory后置处理器
            v.postProcessBeanFactory(beanFactory);
            System.out.println(k + "=" + v);
        });

        System.out.println("==============beanDefinitionNames start==============================");
        //遍历 beanFactory中的beanDefinition,看看加入了多少
        String[] beanDefinitionNames = beanFactory.getBeanDefinitionNames();
        for (String beanDefinitionName : beanDefinitionNames) {
            System.out.println(beanDefinitionName);
        }


        System.out.println("==============往BeanFactory中加入BeanPostProcessor  start==============================");
        //beanFactory 加入  beanPostProcessor 处理器  AutowiredAnnotationBeanPostProcessor   CommonAnnotationBeanPostProcessor
//        Map<String, BeanPostProcessor> beanPostProcessorMap = beanFactory.getBeansOfType(BeanPostProcessor.class);
//        beanPostProcessorMap.forEach((name, beanPostProcessor) -> {
//            beanFactory.addBeanPostProcessor(beanPostProcessor);
//            System.out.println(name);
//        });

        //这里可以根据 添加的顺序 决定那个beanPostProcess先执行  例如：@AutoWried @Resource写在一起的时候，会使用那个、
        //@AutoWried 默认是 按照类型注入
        //@Resource 按照名称注入
        //beanFactory.getDependencyComparator()提供的比较器 ，是根据getOrder 从小到大执行
        Map<String, BeanPostProcessor> beanPostProcessorMap = beanFactory.getBeansOfType(BeanPostProcessor.class);
        beanPostProcessorMap.values().stream().sorted(beanFactory.getDependencyComparator()).forEach(beanPostProcessor -> {
            beanFactory.addBeanPostProcessor(beanPostProcessor);
            System.out.println(beanPostProcessor.getClass());
        });


        //提前实例化单例对象，而不是等到调用的时候在实例化 
        //preInstantiateSingletons里面会调用 getBean()
        beanFactory.preInstantiateSingletons();

        System.out.println("===============getBean=============================");
        MyBean1 bean = beanFactory.getBean(MyBean1.class);
        System.out.println(bean);
        System.out.println(bean.getMyBean2());


    }
```
```java
@Configuration
public class MyConfig {
    @Bean
    public MyBean1 myBean1() {
        return new MyBean1();
    }

    @Bean
    public MyBean2 myBean2() {
        MyBean2 myBean2 = new MyBean2();
        myBean2.setAge("myBean2");
        return myBean2;
    }

    @Bean(name = "resourceMyBean2")
    public MyBean2 resourceMyBean2() {
        MyBean2 myBean2 = new MyBean2();
        myBean2.setAge("resourceMyBean2");
        return myBean2;
    }
}

```
```java
public class MyBean1 {
    private String name;

    @Autowired
    @Resource(name = "resourceMyBean2")
    private MyBean2 myBean2;

    public MyBean1() {
        System.out.println("mybean1构造。。。");
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public MyBean2 getMyBean2() {
        return myBean2;
    }

    @Override
    public String toString() {
        return "MyBean1{" +
                "name='" + name + '\'' +
                ", myBean2=" + myBean2 +
                '}';
    }
}
```
```java
public class MyBean2 {
    private String age;

    public String getAge() {
        return age;
    }

    public void setAge(String age) {
        this.age = age;
    }

    public MyBean2() {
        System.out.println("mybean2构造。。。");
    }

    @Override
    public String toString() {
        return "MyBean2{" +
                "age='" + age + '\'' +
                '}';
    }
}
```
从上面使用BeanFacotry的实现DefaultListableBeanFactory,进行beanDefinition注入 和 getbean可以看到,beanFactory的特点如下:

- **并不会主动的添加和调用BeanFactoryPostProcessor后置处理器的**
- 不会主动添加BeanPostProcess
- 不会主动实例化单例对象
- 不会解析 ${}   #{}

所以可以看到BeanFactory只是一个基础的容器,很多的扩展功能都没有加进来,而ApplicationContext可以给我们做好这些工作,如果我们用比较底层的BeanFactory就需要我们自己做这些事情

关于几个特殊的beanFactory的说明

- `**ConfigurableListableBeanFactory**`**：能够获取bean的BeanDefinition     **`**BeanDefinition getBeanDefinition(String beanName)**`
- `**DefaultListableBeanFactory**`**:提供注册单例bean方法		**`**registerSingleton**`
- `**DefaultSingletonBeanRegistry**`**:三级缓存 **
   - **singletonObjects:一级缓存 **
   - **earlySingltonObjects:二级缓存   **
   - **singletonFactories:三级缓存**



# BeanFactoryPostProcessor的后置处理器顺序
与`beanPostProcessor`后置处理器的顺序一样
```java
beansOfType.values().stream().sorted(beanFactory.getDependencyComparator()).forEach(beanFactoryPostProcessor -> {
    beanFactoryPostProcessor.postProcessBeanFactory(beanFactory);
});
```

## `beanPostProcess`后置处理器的顺序
关于执行顺序 `beanPostProcess`处理器的执行顺序,
例如：@AutoWried @Resource写在一起的时候，到底会使用那个注解,如果我们自己使用BeanFactory,那这个时候就是根据`beanFactory.addBeanPostProcessor(后置处理器)`方法调用中先添加那个`beanPostProcess`的处理器.
BeanFactory中也提供了排序比较器的实现(`beanFactory.getDependencyComparator()`),根据`getOrder`方法获取出来的值,进行排序
```java
Map<String, BeanPostProcessor> beanPostProcessorMap = beanFactory.getBeansOfType(BeanPostProcessor.class);
beanPostProcessorMap.values().stream().sorted(beanFactory.getDependencyComparator()).forEach(beanPostProcessor -> {
    beanFactory.addBeanPostProcessor(beanPostProcessor);
    System.out.println(beanPostProcessor.getClass());
});
```

```java
//创建BeanFactory的实现
DefaultListableBeanFactory beanFactory = new DefaultListableBeanFactory();

//往beanFactory中注册MyConfig的BeanDefinition
AbstractBeanDefinition myConfigBeanDefinition = BeanDefinitionBuilder.genericBeanDefinition(MyConfig.class).setScope("singleton").getBeanDefinition();
beanFactory.registerBeanDefinition("myconfig", myConfigBeanDefinition);

//添加几个比较重要的 bean定义  beanDefinition
//加入了BeanFactory的后置处理器   
//	ConfigurationClassPostProcessor 的beanDefinition ，它会扫描带有@Config的类，并把该类的@Bean 和 @Import 对于的类的BeanDefinition加入到BeanFactory中，并且添加了BeanPostProcessor加入了ImportAwareBeanPostProcessor
//
//加入了BeanPostProcessor处理器    
//		AutowiredAnnotationBeanPostProcessor   CommonAnnotationBeanPostProcessor的beanDefinition 并没有实例化才
// 先执行 BeanDefinitionRegistryPostProcessor.postProcessBeanDefinitionRegistry->  BeanFactoryPostProcessor.postProcessBeanFactory
AnnotationConfigUtils.registerAnnotationConfigProcessors(beanFactory);


System.out.println("==============beanFactoryPostProcess start==============================");
//BeanFactoryPostProcessor 的  实例化
Map<String, BeanFactoryPostProcessor> beansOfType = beanFactory.getBeansOfType(BeanFactoryPostProcessor.class);
beansOfType.forEach((k, v) -> {
    //并且调用BeanFactoryPostProcessor的postProcessBeanFactory后置处理器
    v.postProcessBeanFactory(beanFactory);
    System.out.println(k + "=" + v);
});


System.out.println("==============beanDefinitionNames start==============================");
//遍历 beanFactory中的beanDefinition,看看加入了多少
String[] beanDefinitionNames = beanFactory.getBeanDefinitionNames();
for (String beanDefinitionName : beanDefinitionNames) {
    System.out.println(beanDefinitionName);
}

System.out.println("==============往BeanFactory中加入BeanPostProcessor  start==============================");
//这里可以根据 添加的顺序 决定那个beanPostProcess先执行  例如：@AutoWried @Resource写在一起的时候，会使用那个、
//@AutoWried 默认是 按照类型注入
//@Resource 按照名称注入
//beanFactory.getDependencyComparator()提供的比较器 ，是根据getOrder 从小到大执行
Map<String, BeanPostProcessor> beanPostProcessorMap = beanFactory.getBeansOfType(BeanPostProcessor.class);
beanPostProcessorMap.values().stream().sorted(beanFactory.getDependencyComparator()).forEach(beanPostProcessor -> {
    beanFactory.addBeanPostProcessor(beanPostProcessor);
    System.out.println(beanPostProcessor.getClass());
});


//提前实例化单例对象，而不是等到调用的时候在实例化 getBean
beanFactory.preInstantiateSingletons();

System.out.println("===============getBean=============================");
MyBean1 bean = beanFactory.getBean(MyBean1.class);
System.out.println(bean);
System.out.println(bean.getMyBean2());

```

# ApplicationContext
## ApplicationContext对比BeanFactory的区别
ApplicationContext也继承了BeanFactory,但是比BeanFactory多类四个接口

- MessageSource:国际化功能
```java
ConfigurableApplicationContext run = SpringApplication.run(SpringDemo1.class, args);

//国际化
System.out.println(run.getMessage("hello", null, Locale.ENGLISH));
```
resources文件夹中需要建立messages bunld
![image.png](https://cdn.nlark.com/yuque/0/2022/png/1741454/1662263730287-f245e1e0-1532-4040-881e-03b1e9e6bd2a.png#averageHue=%23f7f7f7&clientId=ud191b97c-66c0-4&errorMessage=unknown%20error&from=paste&height=166&id=uf6af6a94&originHeight=332&originWidth=706&originalType=binary&ratio=1&rotation=0&showTitle=false&size=41350&status=error&style=none&taskId=u1c806d3b-2665-4bcb-af40-314e136eada&title=&width=353)
![image.png](https://cdn.nlark.com/yuque/0/2022/png/1741454/1662263774348-885e7f06-25d7-4785-bfa3-fd9734cef162.png#averageHue=%23fbfaf6&clientId=ud191b97c-66c0-4&errorMessage=unknown%20error&from=paste&height=106&id=u641c1a94&originHeight=212&originWidth=1682&originalType=binary&ratio=1&rotation=0&showTitle=false&size=24486&status=error&style=none&taskId=u61d3579d-03d9-48f0-a123-491313bfd9c&title=&width=841)

- `**ResourcePatternResolver**`:可以根据路径匹配获取文件流
```java
ConfigurableApplicationContext run = SpringApplication.run(SpringDemo1.class, args);

//classpath*:  会从jar中搜索
//classpath:   不会从jar包中搜索
Resource[] resources = run.getResources("classpath*:application.yml");
for (Resource resource : resources) {
    System.out.println(resource);
}
```

- `**ApplicationEventPublisher**`:发布事件
```java
ConfigurableApplicationContext run = SpringApplication.run(SpringDemo1.class, args);

//事件发布
run.publishEvent(new MyEvent(run));
```
```java
public class MyEvent extends ApplicationEvent {
    public MyEvent(Object source) {
        super(source);
    }
}

@Component
public class MyListener {
    @EventListener
    public void envent(MyEvent myEvent) {
        System.out.println("事件："+myEvent);
    }
}

```

- `**EnvironmentCapable**`:获取environment环境的值
```java
ConfigurableApplicationContext run = SpringApplication.run(SpringDemo1.class, args);

ConfigurableEnvironment environment = run.getEnvironment();
System.out.println(environment.getProperty("java.class.path"));
```

![image.png](https://cdn.nlark.com/yuque/0/2022/png/1741454/1662262221021-7e654f07-237c-43c1-bc5b-f81abd13b366.png#averageHue=%23f7f6f4&clientId=ud191b97c-66c0-4&errorMessage=unknown%20error&from=paste&height=331&id=u53e82202&originHeight=662&originWidth=2752&originalType=binary&ratio=1&rotation=0&showTitle=false&size=283102&status=error&style=none&taskId=u3a7c7ccc-80ca-40fd-a99d-1ad4fcf7c76&title=&width=1376)

`ApplicationContext`的主要实现类是`AbstractApplicationContext`,实现了`ConfigurableApplicationContext`接口,里面主要有refresh方法
![image.png](https://cdn.nlark.com/yuque/0/2022/png/1741454/1662262725437-2c9156a5-47ad-4567-a386-8c8c94cc1f36.png#averageHue=%23f7f7f7&clientId=ud191b97c-66c0-4&errorMessage=unknown%20error&from=paste&height=329&id=uaf1dba8c&originHeight=658&originWidth=2754&originalType=binary&ratio=1&rotation=0&showTitle=false&size=86046&status=error&style=none&taskId=u5c54029e-cdec-4a52-be5f-c3f9b2a0c41&title=&width=1377)
## ApplicationContext的各种实现
![image.png](https://cdn.nlark.com/yuque/0/2022/png/1741454/1662518153814-92888f6b-d986-46c2-afb9-78b5fd3e3601.png#averageHue=%23f9f8f8&clientId=u1e2e0e45-e01d-4&errorMessage=unknown%20error&from=paste&height=596&id=uaf2423b6&originHeight=596&originWidth=1875&originalType=binary&ratio=1&rotation=0&showTitle=false&size=54566&status=error&style=none&taskId=u6916bdfd-ce45-4ca8-9858-9bc8cca6a14&title=&width=1875)
ApplicationContext主要有`ClassPathXmlApplicationContext`、`FileSystemXmlApplicationContext`、`AnnotationConfigServletWebServerApplicationContext`、`AnnotationConfigApplicationContext`、`GenericApplicationContext`

### `ClassPathXmlApplicationContext`、`FileSystemXmlApplicationContext`
`ClassPathXmlApplicationContext`、`FileSystemXmlApplicationContext`都是通过加载xml配置文件进行加载
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<beans xmlns="http://www.springframework.org/schema/beans"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.springframework.org/schema/beans
  https://www.springframework.org/schema/beans/spring-beans.xsd">

  <bean id="myBean1" class="com.wl.spring.config.MyBean1">
    <property name="myBean2" ref="myBean2"/>
  </bean>
  <bean id="myBean2" class="com.wl.spring.config.MyBean2">

  </bean>
</beans>
```

```java
    public static void testClassPathXmlApplication() {
        ClassPathXmlApplicationContext classPathXmlApplicationContext = new ClassPathXmlApplicationContext("b01.xml");
        String[] beanDefinitionNames = classPathXmlApplicationContext.getBeanDefinitionNames();

        //打印beanDefinition
        for (String beanDefinitionName : beanDefinitionNames) {
            System.out.println(beanDefinitionName);
        }

        MyBean1 myBean1 = classPathXmlApplicationContext.getBean(MyBean1.class);
        System.out.println(myBean1);
    }
```
```java
//基于磁盘路径的
    public static void testFileSystemXmlApplicationContext() {
        FileSystemXmlApplicationContext fileSystemXmlApplicationContext = new FileSystemXmlApplicationContext("src/main/resources/b01.xml");
        String[] beanDefinitionNames = fileSystemXmlApplicationContext.getBeanDefinitionNames();

        //打印beanDefinition
        for (String beanDefinitionName : beanDefinitionNames) {
            System.out.println(beanDefinitionName);
        }

        MyBean1 myBean1 = fileSystemXmlApplicationContext.getBean(MyBean1.class);
        System.out.println(myBean1);
    }
```

他们的实现都是通过`XmlBeanDefinitionReader`对xml文件进行读取，然后调用`xmlBeanDefinitionReader.loadBeanDefinitions`加载`BeanDefinition`
```java
   public static void testMyXml() {
        DefaultListableBeanFactory beanFactory = new DefaultListableBeanFactory();
        String[] beanDefinitionNames = beanFactory.getBeanDefinitionNames();
        for (String beanDefinitionName : beanDefinitionNames) {
            System.out.println(beanDefinitionName);
        }

        XmlBeanDefinitionReader xmlBeanDefinitionReader = new XmlBeanDefinitionReader(beanFactory);
        //ClassPathXmlApplicationContext
//        xmlBeanDefinitionReader.loadBeanDefinitions(new ClassPathResource("b01.xml"));

//        FileSystemXmlApplicationContext
        xmlBeanDefinitionReader.loadBeanDefinitions(new FileSystemResource("/Users/dile/code/javacode/spring-test-pro/src/main/resources/b01.xml"));

        String[] beanDefinitionNames1 = beanFactory.getBeanDefinitionNames();
        for (String beanDefinitionName : beanDefinitionNames1) {
            System.out.println(beanDefinitionName);
        }
    }
```

### AnnotationConfigApplicationContext
`AnnotationConfigApplicationContext`使用配置类的方式来进行加载，主要通过@Configuration进行
```java
    public static void testAnnotationConfig() {
        AnnotationConfigApplicationContext annotationConfigApplicationContext = new AnnotationConfigApplicationContext(MyConfig.class);
        MyBean1 myBean1 = annotationConfigApplicationContext.getBean(MyBean1.class);
        System.out.println(myBean1);
    }

```
`AnnotationConfigApplicationContext`内部有`AnnotatedBeanDefinitionReader`和`ClassPathBeanDefinitionScanner`
`AnnotatedBeanDefinitionReader`在`AnnotationConfigApplicationContext`内部 主要用于处理 `new AnnotationConfigApplicationContext(MyConfig.class);`带类class的情况

- 作用：它有`registerBean`可以将生成该类的beandefinition，然后放入容器中
- 生成的beandefinition类型是`AnnotatedBeanDefinition`,在经过`ConfigurationClassPostProcessor`处理的时候，不管该bean类上有没有`@Configuration`注解，都会被同等处理，也就是会处理该bean类中的注入bean的注入，例如`@Import` `@ImportResource` `@ComponentScan`  `@Bean`等注解

`ClassPathBeanDefinitionScanner`在`AnnotationConfigApplicationContext`内部 主要用于处理 `new AnnotationConfigApplicationContext("com.wl.mybean");`带包名的情况

### AnnotationConfigServletWebServerApplicationContext
AnnotationConfigServletWebServerApplicationContext主要是可以加入Servlet
```java
    public static void testServletContext() {
        AnnotationConfigServletWebServerApplicationContext servletWebServerApplicationContext = new AnnotationConfigServletWebServerApplicationContext(WebConfig.class);
    }
```
```java
    @Configuration
    static class WebConfig {
        @Bean
        public ServletWebServerFactory servletWebServerFactory() {
            return new TomcatServletWebServerFactory();
        }

        @Bean
        public DispatcherServlet dispatcherServlet() {
            return new DispatcherServlet();
        }

        @Bean
        public DispatcherServletRegistrationBean dispatcherServletRegistrationBean(DispatcherServlet dispatcherServlet) {
            return new DispatcherServletRegistrationBean(dispatcherServlet, "/");
        }

        @Bean("/hello")
        public Controller controller1() {
            return new Controller() {
                @Override
                public ModelAndView handleRequest(HttpServletRequest request, HttpServletResponse response) throws Exception {
                    response.getWriter().print("hello");
                    return null;
                }
            };
        }
    }
}
```
### `GenericApplicationContext`
**GenericApplicationContext不会像其他的ApplicationContext一样，给我们加入各种各样的BeanFactoryPostProcess、BeanPostProcess等，需要自己手动添加，但是如果我们加入了这些处理器可以给我们执行，**不需要像使用DeafultListableBeanFactory要我们手动添加，还需要手动执行。
```java
    public static void main(String[] args) {
        GenericApplicationContext genericApplicationContext = new GenericApplicationContext();


        //注册三个bean
        genericApplicationContext.registerBean("bean1", Bean1.class);
        genericApplicationContext.registerBean("bean2", Bean2.class);
        genericApplicationContext.registerBean("bean3", Bean3.class);
        genericApplicationContext.registerBean("bean4", Bean4.class);

        //@Autowired @Value
        genericApplicationContext.registerBean(AutowiredAnnotationBeanPostProcessor.class);
        //加入 ${}解析
        genericApplicationContext.getDefaultListableBeanFactory().setAutowireCandidateResolver(new ContextAnnotationAutowireCandidateResolver());

        //处理 @Resource @PostConstruct @PreDestroy
        genericApplicationContext.registerBean(CommonAnnotationBeanPostProcessor.class);

        //处理@ConfigurationProperties
        ConfigurationPropertiesBindingPostProcessor.register(genericApplicationContext.getDefaultListableBeanFactory());

        //刷新容器，会执行 beanFactoryPostProcessor   beanPostProcessor,只是不会自动添加 各种处理器
        genericApplicationContext.refresh();

        Bean4 bean4 = genericApplicationContext.getBean(Bean4.class);
        System.out.println(bean4);

        genericApplicationContext.close();


    }
```
## BeanFactory的后置处理器
![image.png](https://cdn.nlark.com/yuque/0/2022/png/1741454/1662511389944-69eaf4d3-bc16-4ba3-9f45-dc1d3c9b219c.png#averageHue=%23f3f2f1&clientId=u1e2e0e45-e01d-4&errorMessage=unknown%20error&from=paste&height=292&id=B64WP&originHeight=292&originWidth=391&originalType=binary&ratio=1&rotation=0&showTitle=false&size=9757&status=error&style=none&taskId=u4a5778ac-dbe6-4f97-8134-67e3c5678f3&title=&width=391)
`BeanFactoryPostProcessor`:一般用于修改已经添加过的BeanName的BeanDefinition
`BeanDefinitionRegistryPostProcessor`：一般用于添加BeanDefinition

`**ImportBeanDefinitionRegistrar**`通过`@Import`注解完成注入，`@Import`放在`@Configuration`上
**ImportBeanDefinitionRegistrar**：它可以往容器中注入 BeanDefinition 并且还可以注入BeanFactoryPostProcessor BeanDefinitionRegistryPostProcessor，因为它比他们两个先执行
```java
public interface ImportBeanDefinitionRegistrar {
    //importingClassMetadata 可以获取到使用@Import(importBeanDefinitionRegistar.class) 作用的类上信息
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry, BeanNameGenerator importBeanNameGenerator) {
    }
}
```

**ImportSelector**：spirngboot的自动配置也是通过该接口实现，它可以添加指定返回一个数组，数组里面都是要加入到Ioc容器的类，通过`@Import`注解完成注入

![spring ioc.svg](https://cdn.nlark.com/yuque/0/2023/svg/1741454/1682408776531-03df4a8a-c9f1-4e6e-8d50-8a181d12759e.svg#clientId=uca6c9f1a-e641-4&from=paste&height=1864&id=ua4684ae5&originHeight=1864&originWidth=2390&originalType=binary&ratio=1&rotation=0&showTitle=false&size=39332&status=done&style=none&taskId=u5062a7ec-5c3e-4de9-8e4f-3ac909aaa90&title=&width=2390)


**AbstractApplicationContext**的refresh方法中的invokeBeanFactoryPostProcessors方法进行BeanFactoryProcessor的调用，完成BeanFactoryProcess解析以及调用

（BeanDefinitionRegistryPostProcessor获取->执行postProcessBeanDefinitionRegistry）（第一次执行这个是执行方法参数传入的BeanDefinitionRegistryPostProcessor）->（BeanDefinitionRegistryPostProcessor获取->执行postProcessBeanDefinitionRegistry）（第二次执行是执行BeanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class)获取到的并带有Order接口的）->（循环遍历获取BeanDefinitionRegistryPostProcessor->执行postProcessBeanDefinitionRegistry）->在执行所有BeanDefinitionRegistryPostProcessor的postProcessBeanFactory方法-》（获取所有有PriorityOrdered顺序的BeanFactoryPostProcessor，如果beanName已经在处理过的set集合中了就跳过->执行postProcessBeanFactory）-》（获取所有有Ordered顺序的BeanFactoryPostProcessor，如果beanName已经在处理过的set集合中了就跳过->执行postProcessBeanFactory）-》（获取所有有没有顺序的BeanFactoryPostProcessor，如果beanName已经在处理过的set集合中了就跳过->执行postProcessBeanFactory）
注意：BeanDefinitionRegistryPostProcessor#postProcessBeanDefinitionRegistry每次执行完这个都会加入到set集合中，下次在获取bean的时候会排除他们的执行
在BeanDefinitionRegistryPostProcessor中还可以注入BeanFactoryPostProcessor的BeanDefinition，但是BeanFactoryPostProcessor不能注入BeanDefinitionRegistryPostProcessor

# Bean的生命周期
在spring中一个对象的生命周期为
![](https://cdn.nlark.com/yuque/0/2022/jpeg/1741454/1662513206706-14ced250-cb42-4988-acdb-27eb0f95d910.jpeg)
spring在实例化前后，以及初始化前后都做了对应的扩展
**Bean的后置处理器是所有bean在创建的时候都会经历的**
**Bean的初始化是bean自己的初始化**
## Bean的后置处理器
![image.png](https://cdn.nlark.com/yuque/0/2022/png/1741454/1662510889968-d40796ba-40fe-4b7e-9103-48e38315e3db.png#averageHue=%23f8f7f7&clientId=u1e2e0e45-e01d-4&errorMessage=unknown%20error&from=paste&height=280&id=ucba36e3a&originHeight=280&originWidth=829&originalType=binary&ratio=1&rotation=0&showTitle=false&size=10490&status=error&style=none&taskId=udb7c71e2-2abc-47af-b4de-c653cb218c2&title=&width=829)
主要有
`InstantiationAwareBeanPostProcessor`：实例化前后，还有属性填充
`BeanPostProcessor`：初始化前后
`DestructionAwareBeanPostProcessor`：bean销毁的时候调用
`SmartInstantiationAwareBeanPostProcessor`：`getEarlyBeanReference`方法用于解决循环依赖问题

![image.png](https://cdn.nlark.com/yuque/0/2022/png/1741454/1662694197706-aa2b45c3-4005-4662-860f-accead41e841.png#averageHue=%23eac581&clientId=u533c6d0a-db05-4&errorMessage=unknown%20error&from=paste&height=315&id=uc1b5d608&originHeight=315&originWidth=1899&originalType=binary&ratio=1&rotation=0&showTitle=false&size=106539&status=error&style=none&taskId=uc96af09d-a94b-4805-b362-c1734b50c90&title=&width=1899)
初始化逻辑：
![image.png](https://cdn.nlark.com/yuque/0/2022/png/1741454/1662475670827-4b351544-6b30-423d-9b9d-206e43373427.png#averageHue=%232d2c2c&clientId=u8b83da76-d04d-4&errorMessage=unknown%20error&from=paste&height=760&id=rMAH6&originHeight=1520&originWidth=1988&originalType=binary&ratio=1&rotation=0&showTitle=false&size=241594&status=error&style=none&taskId=u9d64b593-317f-4360-b3e5-9b0c0e6dca6&title=&width=994)
通过代码实现初始化 ，实例化，的加载扩展点查看加载时机
```java
@Component("lifeCycleBean")
public class LifeCycleBean {
    private static final Logger log= LoggerFactory.getLogger(LifeCycleBean.class);

    public LifeCycleBean() {
        log.info("构造。。");
    }

    @Autowired
    public void autoWire(@Value("${java.home}") String home){
        log.info("依赖注入：{}",home);
    }

    @PostConstruct
    public void init(){
        log.info("初始化：@PostConstruct");
    }

    @PreDestroy
    public void preDestroy(){
        log.info("销毁。。。");
    }
}

```
```java
/**
 * 实例化之前-》构造-》实例化后-》属性注入-》初始化前-》初始化后
 * @author 南顾北衫
 * @description
 * @date 2022/9/6
 */
@Component
public class MyPostProcessor implements InstantiationAwareBeanPostProcessor, DestructionAwareBeanPostProcessor {
    private static final Logger log = LoggerFactory.getLogger(MyPostProcessor.class);

    //=============DestructionAwareBeanPostProcessor
    @Override
    public void postProcessBeforeDestruction(Object bean, String beanName) throws BeansException {
        if (beanName.equals("lifeCycleBean")) {
            log.info("<<<<<<销毁方法之前执行 ，如@PreDestory");
        }
    }

    @Override
    public boolean requiresDestruction(Object bean) {
        return true;
    }

    //============BeanPostProcessor
    /**
     * 初始化：
        aware(beanNameAware,BeanClassLoadAware,BeanFactoryAware)->postProcessBeforeInitialization->InitializingBean->xml中自定义的init-method方法->postProcessAfterInitialization
     */

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        if (beanName.equals("lifeCycleBean")) {
            log.info("<<<<<<初始化之前执行，如@PostConstruct @ConfigurationProperties ");
        }
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (beanName.equals("lifeCycleBean")) {
            log.info("<<<<<<初始化之后执行 ,返回对象会替换原来的bean 如代理增强");
        }
        return bean;
    }

    //====InstantiationAwareBeanPostProcessor
    @Override
    public Object postProcessBeforeInstantiation(Class<?> beanClass, String beanName) throws BeansException {
        if (beanName.equals("lifeCycleBean")) {
            log.info("<<<<<<实例化之前执行 ");
        }
        return null;
    }

    @Override
    public boolean postProcessAfterInstantiation(Object bean, String beanName) throws BeansException {
        if (beanName.equals("lifeCycleBean")) {
            log.info("<<<<<<实例化之后执行 ，返回false会跳过依赖注入阶段");
        }
        return true;
    }

    @Override
    public PropertyValues postProcessProperties(PropertyValues pvs, Object bean, String beanName) throws BeansException {
        if (beanName.equals("lifeCycleBean")) {
            log.info("<<<<<<依赖注入阶段 @AutoWried  @Resource @Value");
        }
        return pvs;
    }
}

```
```java
@SpringBootApplication
public class LifeBeanApplication {
    public static void main(String[] args) {
        ConfigurableApplicationContext run = SpringApplication.run(LifeBeanApplication.class, args);
        run.close();
    }
}

```
![image.png](https://cdn.nlark.com/yuque/0/2022/png/1741454/1662606028652-abf6dbe1-542a-48ae-bc0c-323a06ad1643.png#averageHue=%23f8f6f4&clientId=uca4ba74a-27e1-4&errorMessage=unknown%20error&from=paste&height=608&id=u349b5dd6&originHeight=608&originWidth=1765&originalType=binary&ratio=1&rotation=0&showTitle=false&size=253150&status=error&style=none&taskId=uf1f25d84-a690-44db-9045-2013f7a0dd0&title=&width=1765)

## 常用的Bean后置处理器
```java
AutowiredAnnotationBeanPostProcessor 处理@Autowired @Value注入注解
    
CommonAnnotationBeanPostProcessor  处理@Resource @PostConstruct @PreDestroy
    
ConfigurationPropertiesBindingPostProcessor 处理@ConfigurationProperties
```
### AutowiredAnnotationBeanPostProcessor
`@Autowired`注解解析用到的后处理器是`AutowiredAnnotationBeanPostProcessor`

- 这个后处理器就是通过调用`postProcessProperties(PropertyValues pvs, Object bean, String beanName)`完成注解的解析和注入的功能
- 这个方法中又调用了一个私有的方法`findAutowiringMetadata(beanName, bean.getClass(), pvs)`，其返回值`InjectionMetadata`中封装了被`@Autowired`注解修饰的属性和方法
- 然后会调用`InjectionMetadata.inject(bean1, "bean1", null)`进行依赖注入
- 由于`InjectionMetadata.inject(bean1, "bean1", null)`的源码调用链过长，摘出主要调用过程进行说明：
- 成员变量注入，`InjectionMetadata`注入`Bean3`的过程： 
   - `InjectionMetadata`会把`Bean1`中加了`@Autowired`注解的属性的`BeanName`先拿到，这里拿到的`BeanName`就是 `bean3`，然后再通过反射拿到这个属性，`Field bean3Field = Bean1.class.getDeclaredField("bean3");`
   - 将这个属性封装成一个`DependencyDescriptor`对象，再去调用`Bean3 bean3Value = (Bean3) beanFactory.doResolveDependency(dd1, null, null, null);`拿到`bean3Value`
   - 最后把值赋给这个属性`bean3Field.set(bean1, bean3Value);`
- 方法参数注入，`InjectionMetadata`注入`Bean2`的过程： 
   - `InjectionMetadata`会把`Bean1`中加了`@Autowired`注解的方法的`MethodName`先拿到，这里拿到的`MethodName`就是 `setBean2`，然后再通过反射拿到这个方法，`Method setBean2 = Bean1.class.getDeclaredMethod("setBean2", Bean2.class);`
   - 将这个属性封装成一个`DependencyDescriptor`对象，再去调用`Bean2 bean2Value = (Bean2) beanFactory.doResolveDependency(dd2, "bean2", null, null);`拿到`bean2Value`
   - 最后调用方法`setBean2.invoke(bean1, bean2Value)`，给方法参数赋值。
- 方法参数注入，参数类型为String类型，且加上了@Value注解，`InjectionMetadata`注入环境变量`JAVA_HOME`的过程： 
   - `InjectionMetadata`会把`Bean1`中加了`@Autowired`注解的方法的`MethodName`先拿到，这里拿到的`MethodName`就是 `setJava_home`，然后再通过反射拿到这个方法，`Method setJava_home = Bean1.class.getDeclaredMethod("setJava_home", String.class);`
   - 将这个属性封装成一个`DependencyDescriptor`对象，再去调用`String java_home = (String) beanFactory.doResolveDependency(dd3, null, null, null);`拿到`java_home`
   - 最后调用方法`setJava_home.invoke(bean1, java_home);`，给方法参数赋值。

通过`InstantiationAwareBeanPostProcessor#postProcessProperties`依赖注入阶段的扩展点
```java
	public PropertyValues postProcessProperties(PropertyValues pvs, Object bean, String beanName) {
		InjectionMetadata metadata = findAutowiringMetadata(beanName, bean.getClass(), pvs);
		try {
			metadata.inject(bean, beanName, pvs);
		}
		catch (BeanCreationException ex) {
			throw ex;
		}
		catch (Throwable ex) {
			throw new BeanCreationException(beanName, "Injection of autowired dependencies failed", ex);
		}
		return pvs;
	}
```
```java
    public static void main(String[] args) throws Throwable {
        DefaultListableBeanFactory beanFactory = new DefaultListableBeanFactory();

//        beanFactory.registerSingleton("bean1", new Bean1());
        beanFactory.registerSingleton("bean2", new Bean2());

        beanFactory.setAutowireCandidateResolver(new ContextAnnotationAutowireCandidateResolver());
        beanFactory.addEmbeddedValueResolver(new StandardEnvironment()::resolvePlaceholders);

        AutowiredAnnotationBeanPostProcessor autowiredAnnotationBeanPostProcessor = new AutowiredAnnotationBeanPostProcessor();
        autowiredAnnotationBeanPostProcessor.setBeanFactory(beanFactory);

        Bean1 bean1 = new Bean1();
        //========使用autowiredAnnotationBeanPostProcessor提供的postProcessProperties进行属性填充
//        autowiredAnnotationBeanPostProcessor.postProcessProperties(null, bean1, "bean1");
//
//        System.out.println(bean1);


        //=================通过AutowiredAnnotationBeanPostProcessor的内部方法进行调用填充,离源码有近了一步
        //1.通过调用AutowiredAnnotationBeanPostProcessor.findAutowiringMetadata()找到要注入的字段或者方法参数
//        Method findAutowiringMetadata = AutowiredAnnotationBeanPostProcessor.class.getDeclaredMethod("findAutowiringMetadata", String.class, Class.class, PropertyValues.class);
//        findAutowiringMetadata.setAccessible(true);
//        InjectionMetadata injectionMetadata = (InjectionMetadata) findAutowiringMetadata.invoke(autowiredAnnotationBeanPostProcessor, "bean1", Bean1.class, null);
//        System.out.println(injectionMetadata);
//
//        //2.注入依赖
//        injectionMetadata.inject(bean1, null, null);
//        System.out.println(bean1);


        //==========直接使用底层源码实现注入
        //1.方法注入 获取@AutoWried注解对应的方法->封装成MethodParameter -》封装DependencyDescriptor-》beanFactory.doResolveDependency得到依赖结果->反射调用方法  给方法参数赋值
        Method setBean2 = bean1.getClass().getDeclaredMethod("setBean2", Bean2.class);
        MethodParameter methodParameter = new MethodParameter(setBean2, 0);
        DependencyDescriptor dependencyDescriptor = new DependencyDescriptor(methodParameter, false);
        Bean2 bean2 = (Bean2) beanFactory.doResolveDependency(dependencyDescriptor, "bean2", null, null);
        setBean2.invoke(bean1, bean2);
        System.out.println(bean1);

        //2. @value注入
        Method setHome = bean1.getClass().getDeclaredMethod("setHome", String.class);
        MethodParameter mtp1 = new MethodParameter(setHome, 0);
        DependencyDescriptor dp1 = new DependencyDescriptor(mtp1, false);
        String home = (String) beanFactory.doResolveDependency(dp1, null, null, null);
        setHome.invoke(bean1, home);
        System.out.println(bean1);
    }
```
# 常见Bean工厂后处理器以及模拟实现组件扫描
## `ConfigurationClassPostProcessor`
`ConfigurationClassPostProcessor`处理器器可以处理`@Configration  @Import @ImportResource @Bean @ComponentScan @**PropertySources**`这些注解
```java
public class TestBeanFactoryPostProcessors {

    public static void main(String[] args) {
        //⬇️GenericApplicationContext 是一个【干净】的容器，默认不会添加任何后处理器，方便做测试
        GenericApplicationContext genericApplicationContext = new GenericApplicationContext();

        //注入配置类
        genericApplicationContext.registerBean("myConfig", MyConfigTest.class);

        //注入 @Configration  @Import @ImportSources @Bean @ComponentScan 注解处理器
        genericApplicationContext.addBeanFactoryPostProcessor(new ConfigurationClassPostProcessor());

        //初始化容器  执行  beanFactoryPostProcess接口 -> beanPostProcess接口 -> 实例化 非懒加载 单例bean对象
        genericApplicationContext.refresh();

        //获取容器里面所有的BeanDefinition
        String[] beanDefinitionNames = genericApplicationContext.getBeanDefinitionNames();
        for (String beanDefinitionName : beanDefinitionNames) {
            System.out.println(beanDefinitionName);
        }

        //销毁容器
        genericApplicationContext.close();

    }

    @Configuration
    static class MyConfigTest {
        @Bean
        public Bean1 bean1() {
            return new Bean1();
        }

    }
}
```
### @ComponentScan的处理
使用spring提供的类自己写一个spring的`@ComponentScan`注解处理，完成BeanDefinition的加载
```java
public class MyConfigBeanFactoryPostProcess implements BeanDefinitionRegistryPostProcessor {
    private final static Logger log = LoggerFactory.getLogger(MyConfigBeanFactoryPostProcess.class);

    @Override
    public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) throws BeansException {
        ComponentScan componentScan = AnnotationUtils.findAnnotation(TestMyBeanFactoryPostProcessors.MyConfigTest.class, ComponentScan.class);
        if (componentScan != null) {
            String[] basePackages = componentScan.basePackages();
            for (String basePackage : basePackages) {
                log.info("basePackage:{}", basePackage);
                // top.jacktgq.component -> classpath*:com/jacktgq/component/**/*.class
                String path = "classpath*:" + basePackage.replace('.', '/') + "/**/*.class";
                log.info("path:{}", path);

                try {

                    //配合MetadataReader使用可以根据resource获取到类元信息
                    CachingMetadataReaderFactory factory = new CachingMetadataReaderFactory();

                    //beanName生成器  ，主要根据
                    AnnotationBeanNameGenerator generator = new AnnotationBeanNameGenerator();

                    //   获取Component 的 全类名
                    String name = Component.class.getName();
                    //根据路径获取文件资源
                    Resource[] resources = new PathMatchingResourcePatternResolver().getResources(path);
                    for (Resource resource : resources) {
                        //传入resource可以获取类元信息，包括类信息，注解信息
                        MetadataReader metadataReader = factory.getMetadataReader(resource);
                        //可以获取到类上面的注解信息
                        AnnotationMetadata annotationMetadata = metadataReader.getAnnotationMetadata();

                        //hasAnnotation 判断是否有name注解     有就返回true
                        //hasMetaAnnotation 只要注解的父类有就可以  @service有 @Component注解就返回true
                        if (annotationMetadata.hasAnnotation(name) || annotationMetadata.hasMetaAnnotation(name)) {
                            //生成beanDefinition
                            AbstractBeanDefinition beanDefinition = BeanDefinitionBuilder.genericBeanDefinition(metadataReader.getClassMetadata().getClassName()).getBeanDefinition();
                            //生成BeanName
                            String beanName = generator.generateBeanName(beanDefinition, registry);
                            //注册信息
                            registry.registerBeanDefinition(beanName, beanDefinition);
                        }
                    }
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

        }

    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {

    }
}

```
```java
public class TestMyBeanFactoryPostProcessors {

    public static void main(String[] args) {
        //⬇️GenericApplicationContext 是一个【干净】的容器，默认不会添加任何后处理器，方便做测试
        GenericApplicationContext genericApplicationContext = new GenericApplicationContext();

        //注入配置类
        genericApplicationContext.registerBean("myConfig", MyConfigTest.class);

        //注入 自己模拟@ComponentScan注解 工厂后置处理器
        genericApplicationContext.addBeanFactoryPostProcessor(new MyConfigBeanFactoryPostProcess());

        //初始化容器  执行  beanFactoryPostProcess接口 -> beanPostProcess接口 -> 实例化 非懒加载 单例bean对象
        genericApplicationContext.refresh();

        //获取容器里面所有的BeanDefinition
        String[] beanDefinitionNames = genericApplicationContext.getBeanDefinitionNames();
        for (String beanDefinitionName : beanDefinitionNames) {
            System.out.println(beanDefinitionName);
        }

        //销毁容器
        genericApplicationContext.close();

    }

    @ComponentScan(basePackages = {"com.wl.spring.sacn"})
    @Configuration
    static class MyConfigTest {
        @Bean
        public BeanScan2 beanScan2() {
            return new BeanScan2();
        }

    }
}
```
# @Autowired注解失效分析
**BeanFactoryPostProcessor阶段需要先实例化对象，然后才能执行后置处理**`**postProcessBeanFactory**`
ApplicationContextAwareProcessor的bean后置处理器在refresh的prepareBeanFactory()方法中就执行了添加后置处理器
```java
@Component
public class MyBean1 {
    private String name;

    @Override
    public String toString() {
        return "MyBean1{" +
                "name='" + name + '\'' +
                '}';
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}

```
```java
@Configuration("myAutowiredConfig")
public class MyAutowiredConfig implements ApplicationContextAware {
    private static final Logger log = LoggerFactory.getLogger(MyAutowiredConfig.class);

    @Autowired
    private void setMyBean1(MyBean1 myBean1) {
        log.info("MyAutowiredConfig:Autowired mybean1={}", myBean1);
    }

    @PostConstruct
    public void init() {
        log.info("MyAutowiredConfig:初始化。。。");
    }

    public MyAutowiredConfig() {
        log.info("MyAutowiredConfig:构造。。。");
    }

    //@Autowired  @PostConstruct不会失效
    //因为它是静态工厂，不需要先实例化MyAutowiredConfig这个对象就能够通过beanFactoryPostProcessor创建我的BeanFactoryPostProcessor
    /*@Bean
    public static BeanFactoryPostProcessor beanFactoryPostProcessor() {
        return (configurableListableBeanFactory) -> {
            log.info("MyAutowiredConfig:beanPostProcessor。。。");
        };
    }*/

    //@Autowired  @PostConstruct会失效
    //因为它是实例工厂，必须要先把实例创建出来，才能调用beanFactoryPostProcessor()创建我的BeanFactoryPostProcessor,而许多beanPostProcess是在BeanFactoryPostProcessor调用后才添加到BeanFacotry中的，
    // 因此，它实例化的时候也就是beanFactory.getBean()的时候，执行beanPostProcessor的时候，getBeanPostProcessor()还没有@Autowried @PostConstruct 对应的bean后置处理器
    // AutowiredAnnotationBeanPostProcessor和CommonAnnotationBeanPostProcessor在beanFactory的beanPostProcessor列表中(但是他们已经加入了beanDefinitions里面了，会在refresh方法中的registerBeanPostProcessors()进行实例化，所以导致@Autowried @PostConstruct 不生效

    //ApplicationContextAwareProcessor的bean后置处理器在refresh的prepareBeanFactory()方法中就执行了添加后置处理器，也就是在调用beanFactoryProcessor的扩展点之前就添加进去了，所以都会生效
    @Bean
    public  BeanFactoryPostProcessor beanFactoryPostProcessor() {
        return (configurableListableBeanFactory) -> {
            log.info("MyAutowiredConfig:beanPostProcessor。。。");
        };
    }


    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        log.info("MyAutowiredConfig:ApplicationContextAware。。。");
    }
}

```
```java
@SpringBootApplication
public class AutowiredInvalidTest {
    public static void main(String[] args) {
        SpringApplication.run(AutowiredInvalidTest.class,args);
    }
}

```
# scope失效
比如在单例中,如果里面需要使用@autowried注入一个原型多例的对象,这个时候多次获取到的注入的多例对象其实都是同一个
```java
@Scope(scopeName = "singleton")
public class MyScopeBean2 {
    private String age;

    private MyScopeBean1 myScopeBean1;

    public String getAge() {
        return age;
    }

    public void setAge(String age) {
        this.age = age;
    }

    public MyScopeBean1 getMyScopeBean1() {
        return myScopeBean1;
    }

//    @Lazy
    @Autowired
    public void setMyScopeBean1(MyScopeBean1 myScopeBean1) {
        this.myScopeBean1 = myScopeBean1;
    }
}
```
```java
@Component
//@Scope(scopeName = "prototype",proxyMode = ScopedProxyMode.TARGET_CLASS )
@Scope(scopeName = "prototype")
public class MyScopeBean1 {
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}

```
```java
@SpringBootApplication
public class ScopeApplication {
    public static void main(String[] args) {
        ConfigurableApplicationContext run = SpringApplication.run(ScopeApplication.class, args);

        MyScopeBean2 myScopeBean2 = run.getBean(MyScopeBean2.class);
        System.out.println(myScopeBean2.getMyScopeBean1());//1

        MyScopeBean2 myScopeBean2 = run.getBean(MyScopeBean2.class);
        System.out.println(myScopeBean2.getMyScopeBean1());  //2
        //1和2 打印出来的对象地址都是同一个
    }
```
解决这个问题的原理就是延迟获取bean对象

1. 使用@Lazy
2. 使用@Scope的 通过@Scope的代理模式 proxyMode=ScopedProxyMode.TARGET_CLASS 产生代理类
3. 使用objectFactory
4. applicationContext获取


