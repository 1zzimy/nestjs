import { GoneException, Injectable, NotFoundException, Logger, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { User } from '../domain/user.entity';
import { UserInfoDto } from '../interface/dto/user-info.dto';
import { CreateUserDto } from '../interface/dto/create-user.dto';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) {}

    async getAllUsers(): Promise<UserInfoDto[]> {
        this.logger.log(`회원 목록 조회 실행`);
        const users = await this.usersRepository.find();
        this.logger.debug(`조회된 회원 수: ${users.length}`);
        return plainToInstance(UserInfoDto, users, { excludeExtraneousValues: true }); // DTO에 @Expose 붙은 값만 응답에 포함
    }

    async getUser(id: number): Promise<UserInfoDto> {
        this.logger.log(`회원 조회 실행 - id: ${id}`);
        const found = await this.getUserById(id);
        return plainToInstance(UserInfoDto, found, { excludeExtraneousValues: true }); 
    }

    // 회원 조회
    async getUserById(id: number): Promise<User> {
        this.logger.log(`회원 조회 시작 - id: ${id}`);
        const found = await this.usersRepository.findOne({where: {id: id}});
        if(!found) {
            this.logger.warn(`회원 없음 - id: ${id}`);
            throw new NotFoundException("존재하지 않는 회원입니다."); // 404 NotFound
        }
        if(!found.isActive) {
            this.logger.warn(`탈퇴한 회원 접근 - id: ${id}`);
            throw new GoneException("탈퇴한 회원입니다."); // 410 Gone
        }
        this.logger.log(`회원 조회 성공 - id: ${id}`);
        this.logger.debug(`회원 조회 결과 -  name: ${found.name}, email: ${found.email}`)
        return found;
    }

    // 이메일 중복 확인
    async existsByEmail(email: string): Promise<void> {
        const exists = await this.usersRepository.findOne({where: {email: email}});
        if(exists) throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    async createUser(createUserDto: CreateUserDto): Promise<UserInfoDto> {
        this.logger.log(`회원 가입 실행 - email: ${createUserDto.email}`);
        await this.existsByEmail(createUserDto.email);
        const user = this.usersRepository.create(createUserDto);
        await this.usersRepository.save(user);
        this.logger.log(`회원 가입 완료 - id: ${user.id}, email: ${user.email}`);
        return plainToInstance(UserInfoDto, user, { excludeExtraneousValues: true });
    }

    // soft delete (isActive = false)
    async removeUser(id: number): Promise<void> {
        this.logger.log(`회원 탈퇴 실행 - id: ${id}`);
        const found = await this.getUserById(id);
        await this.usersRepository.update(found.id, { isActive: false });
        this.logger.log(`회원 탈퇴 완료 - id: ${id}`);
    }

    async findActiveUserByEmailWithPassword(email: string): Promise<User | null> {
        this.logger.log(`이메일로 회원 조회 (로그인) - email: ${email}`);
        const user = await this.usersRepository.findOne({
            where: { email },
            select: ['id', 'email', 'pwd', 'name', 'isActive'],
        });

        if (!user) {
            this.logger.warn(`회원 없음 - email: ${email}`);
            return null;
        }

        if (!user.isActive) {
            this.logger.warn(`탈퇴한 회원 접근 - email: ${email}`);
            throw new GoneException('탈퇴한 회원입니다.');
        }

        return user;
    }

    async findInactiveUserByEmail(email: string): Promise<User | null> {
        this.logger.log(`비활성 회원 조회 - email: ${email}`);
        return this.usersRepository.findOne({
            where: { email, isActive: false },
            select: ['id', 'email', 'pwd', 'name', 'isActive'],
        });
    }

    async activateUser(id: number): Promise<void> {
        this.logger.log(`회원 활성화 - id: ${id}`);
        await this.usersRepository.update(id, { isActive: true });
    }
}
