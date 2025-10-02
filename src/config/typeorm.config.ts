import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const typeORMConfig : TypeOrmModuleOptions = {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'user',
    password: '1234',
    database: 'nest-db', 
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    synchronize: true
}